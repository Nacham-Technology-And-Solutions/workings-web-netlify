
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeftIcon, EditIcon, EyeIcon, EyeOffIcon } from '@/assets/icons/IconComponents';
import { useAuthStore } from '@/stores';
import { userService, subscriptionsService } from '@/services/api';
import { getUserInitials } from '@/utils/userHelpers';
import { extractErrorMessage } from '@/utils/errorHandler';
import { normalizeApiResponse, isApiResponseSuccess, getApiResponseData, getApiResponseMessage } from '@/utils/apiResponseHelper';
import ErrorMessage from '@/components/common/ErrorMessage';

interface ProfileScreenProps {
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

const LoadingOverlay: React.FC = () => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity duration-300">
        <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-base text-gray-700 font-medium">Saving changes</p>
        </div>
    </div>
);


const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, onNavigate }) => {
  const { user, updateUser } = useAuthStore();
  const [initialData, setInitialData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '', // Password is not stored
    companyName: user?.companyName || '',
    companyAddress: '', // Not in user profile yet
  });

  const [formData, setFormData] = useState(initialData);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [pointsBalance, setPointsBalance] = useState<number | undefined>(user?.pointsBalance);
  const userInitials = getUserInitials(user?.name);
  
  const hasPasswordChanged = useMemo(() => newPassword.length > 0, [newPassword]);

  // Fetch fresh user data from API when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        // Fetch both user profile and current subscription (subscription has points balance)
        const [profileResponse, subscriptionResponse] = await Promise.allSettled([
          userService.getProfile(user.id),
          subscriptionsService.getCurrent(),
        ]);

        let userProfile: any = null;
        let pointsBalance: number | undefined = user?.pointsBalance;

        // Process user profile response
        if (profileResponse.status === 'fulfilled') {
          const apiResponse = profileResponse.value;
          const normalizedResponse = normalizeApiResponse(apiResponse);

          if (normalizedResponse.success && normalizedResponse.response) {
            const responseData = normalizedResponse.response as any;
            // API returns { userProfile: {...}, accessToken: "...", refreshToken: "...", subscriptionStatus: "..." }
            userProfile = responseData.userProfile || responseData.user || responseData;
          }
        }

        // Process subscription response (has points balance)
        if (subscriptionResponse.status === 'fulfilled') {
          const apiResponse = subscriptionResponse.value;
          const normalizedResponse = normalizeApiResponse(apiResponse);

          if (normalizedResponse.success && normalizedResponse.response) {
            const responseData = normalizedResponse.response as any;
            const subscription = responseData.subscription || responseData;
            
            // Get points balance from subscription (more reliable)
            if (subscription.pointsBalance !== undefined) {
              pointsBalance = subscription.pointsBalance;
            }
            
            // Also update subscription status if available
            if (subscription.plan && userProfile) {
              userProfile.subscriptionStatus = subscription.plan;
            }
          }
        } else {
          console.warn('Failed to fetch subscription:', subscriptionResponse.reason);
        }

        // Fallback: try to get pointsBalance from user profile if subscription didn't have it
        if (pointsBalance === undefined && userProfile) {
          pointsBalance = userProfile.pointsBalance !== undefined 
            ? userProfile.pointsBalance 
            : userProfile.points;
        }

        // Update local state immediately for UI responsiveness
        if (pointsBalance !== undefined) {
          setPointsBalance(pointsBalance);
        }

        // Update auth store with fresh data including pointsBalance
        // Always update pointsBalance even if userProfile fetch failed
        const subscriptionPlan = subscriptionResponse.status === 'fulfilled' 
          ? (normalizeApiResponse(subscriptionResponse.value).response as any)?.subscription?.plan 
          : undefined;
        
        updateUser({
          ...(userProfile ? {
            name: userProfile.name,
            email: userProfile.email,
            companyName: userProfile.companyName,
            subscriptionStatus: userProfile.subscriptionStatus || subscriptionPlan,
          } : {}),
          pointsBalance: pointsBalance,
        });

        // Update local form data if we have user profile
        if (userProfile) {
          const newInitialData = {
            name: userProfile.name || '',
            email: userProfile.email || '',
            password: '',
            companyName: userProfile.companyName || '',
            companyAddress: '', // Not in user profile yet
          };
          setInitialData(newInitialData);
          setFormData(newInitialData);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        // Don't show error to user, just use existing data
      }
    };

    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only fetch when user ID changes

  // Update form data when user changes (from store)
  useEffect(() => {
    if (user) {
      const newInitialData = {
        name: user.name || '',
        email: user.email || '',
        password: '',
        companyName: user.companyName || '',
        companyAddress: '', // Not in user profile yet
      };
      setInitialData(newInitialData);
      setFormData(newInitialData);
      
      // Update local pointsBalance when store updates
      if (user.pointsBalance !== undefined) {
        setPointsBalance(user.pointsBalance);
      }
    }
  }, [user]);
  
  const handleEditClick = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleCancelClick = () => {
    setEditingField(null);
    setTempValue('');
  };
  
  const handleFieldSave = async (field: string) => {
    if (!user) return;
    
    // Handle companyAddress locally (not in API yet)
    if (field === 'companyAddress') {
      const newFormData = { ...formData, [field]: tempValue };
      setFormData(newFormData);
      setInitialData(newFormData);
      handleCancelClick();
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const updateData: { name?: string; email?: string; companyName?: string } = {};
      
      if (field === 'name') updateData.name = tempValue;
      if (field === 'email') updateData.email = tempValue;
      if (field === 'companyName') updateData.companyName = tempValue;
      
      // Update via API
      const apiResponse = await userService.updateProfile(user.id, updateData);
      const normalizedResponse = normalizeApiResponse(apiResponse);
      
      if (isApiResponseSuccess(apiResponse)) {
        const responseData = getApiResponseData(apiResponse);
        
        // Handle nested response structure
        const userProfile = (responseData as any).user || responseData;
        
        // Update auth store with new user data
        updateUser({
          name: userProfile.name,
          email: userProfile.email,
          companyName: userProfile.companyName,
          subscriptionStatus: userProfile.subscriptionStatus,
          pointsBalance: userProfile.pointsBalance,
        });
        
        // Update local form data
        const newFormData = { ...formData, [field]: tempValue };
        setFormData(newFormData);
        setInitialData(newFormData);
        handleCancelClick();
      } else {
        setError(getApiResponseMessage(apiResponse) || 'Failed to update profile');
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordEdit = () => {
    setEditingField('password');
  };
  
  const handlePasswordCancel = () => {
    setEditingField(null);
    setNewPassword('');
    setConfirmPassword('');
  }

  const handlePasswordSave = async () => {
    if (!user) return;
    
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Note: We need current password for the API
      const apiResponse = await userService.changePassword(user.id, {
        currentPassword: currentPassword,
        newPassword: newPassword,
      });
      
      const normalizedResponse = normalizeApiResponse(apiResponse);
      
      if (isApiResponseSuccess(apiResponse)) {
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
        setEditingField(null);
      } else {
        const errorMsg = getApiResponseMessage(apiResponse) || 'Failed to change password';
        setError(errorMsg);
        const apiResponseData = (apiResponse as any)?.response || apiResponse;
        setDetailedError(apiResponseData?.message || apiResponseData?.error || null);
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage.message);
      setDetailedError(errorMessage.detailedMessage || null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    // All changes are saved individually when fields are saved
    // This button can be used for bulk save if needed in the future
  };
  
  const inputClass = "w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 placeholder:text-gray-400 disabled:bg-gray-50";
  const isEditingNonPassword = editingField && editingField !== 'password';
  
  const renderField = (id: 'name' | 'email' | 'companyName' | 'companyAddress', label: string) => {
      const isEditingThisField = editingField === id;
      return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
                {isEditingThisField ? (
                    <button type="button" onClick={handleCancelClick} className="text-sm font-medium text-red-600 hover:text-red-800">Cancel</button>
                ) : (
                    <button type="button" onClick={() => handleEditClick(id, formData[id])} className="text-sm font-medium text-gray-600 hover:text-gray-900">Edit</button>
                )}
            </div>
            <input
                id={id}
                type={id === 'email' ? 'email' : 'text'}
                value={isEditingThisField ? tempValue : formData[id]}
                onChange={(e) => setTempValue(e.target.value)}
                className={inputClass}
                disabled={!isEditingThisField}
            />
            {isEditingThisField && (
                <div className="mt-2">
                    <button type="button" onClick={() => handleFieldSave(id)} className="px-5 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700">
                        Save
                    </button>
                </div>
            )}
        </div>
      );
  };


  return (
    <div className="flex flex-col h-full bg-white font-sans text-gray-800">
      {isSaving && <LoadingOverlay />}
      
      <div className="flex-1 overflow-y-auto pb-24">
        {/* User Avatar - Centered */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center border border-gray-300">
              <span className="text-gray-900 font-bold text-3xl">{userInitials}</span>
            </div>
            <button 
              className="absolute bottom-0 right-0 bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-blue-200 transition-colors" 
              aria-label="Edit profile picture"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSaveChanges}>
          {/* Error Message */}
          {error && (
            <div className="mb-4">
              <ErrorMessage
                message={error}
                detailedMessage={detailedError || undefined}
                onDismiss={() => {
                  setError(null);
                  setDetailedError(null);
                }}
              />
            </div>
          )}
          
          {/* Subscription & Credits Section */}
          <section className="mb-8">
            <h2 className="text-base font-bold mb-4 text-gray-900">Subscription & Credits</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {/* Subscription Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Subscription Plan</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user?.subscriptionStatus === 'enterprise' 
                        ? 'bg-purple-100 text-purple-800'
                        : user?.subscriptionStatus === 'pro'
                        ? 'bg-blue-100 text-blue-800'
                        : user?.subscriptionStatus === 'starter'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user?.subscriptionStatus ? user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1) : 'Free'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('subscriptionPlans');
                    }
                  }}
                  className="text-sm font-medium text-primary hover:text-primary/80 underline"
                >
                  Manage
                </button>
              </div>

              {/* Points Balance */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div 
                  className="cursor-pointer"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('creditsHistory');
                    }
                  }}
                >
                  <p className="text-sm font-medium text-gray-700 mb-1">Available Credits</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(pointsBalance !== undefined ? pointsBalance : user?.pointsBalance) !== undefined 
                      ? (pointsBalance !== undefined ? pointsBalance : user?.pointsBalance)!.toLocaleString() 
                      : '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Points remaining</p>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate('creditsHistory');
                      }
                    }}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 underline"
                  >
                    View History
                  </button>
                </div>
              </div>

              {/* Low Points Warning */}
              {((pointsBalance !== undefined ? pointsBalance : user?.pointsBalance) !== undefined && 
                (pointsBalance !== undefined ? pointsBalance : user?.pointsBalance)! < 50) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">Low Credits Warning</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        You're running low on credits. Consider upgrading your plan to continue using all features.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Personal Details Section */}
          <section className="mb-8">
            <h2 className="text-base font-bold mb-4 text-gray-900">Personal Details</h2>
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingField === 'name' ? tempValue : formData.name}
                    onChange={(e) => setTempValue(e.target.value)}
                    disabled={editingField !== 'name'}
                    className={`flex-1 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 ${
                      editingField === 'name' ? 'bg-white border-gray-400' : ''
                    }`}
                  />
                  {editingField === 'name' ? (
                    <button 
                      type="button" 
                      onClick={handleCancelClick} 
                      className="text-sm font-medium text-gray-700"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => handleEditClick('name', formData.name)} 
                      className="text-sm font-medium text-gray-700"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingField === 'name' && (
                  <div className="mt-3">
                    <button 
                      type="button" 
                      onClick={() => handleFieldSave('name')} 
                      className="px-6 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              {/* Email Address Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={editingField === 'email' ? tempValue : formData.email}
                    onChange={(e) => setTempValue(e.target.value)}
                    disabled={editingField !== 'email'}
                    className={`flex-1 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 ${
                      editingField === 'email' ? 'bg-white border-gray-400' : ''
                    }`}
                  />
                  {editingField === 'email' ? (
                    <button 
                      type="button" 
                      onClick={handleCancelClick} 
                      className="text-sm font-medium text-gray-700"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => handleEditClick('email', formData.email)} 
                      className="text-sm font-medium text-gray-700"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingField === 'email' && (
                  <div className="mt-3">
                    <button 
                      type="button" 
                      onClick={() => handleFieldSave('email')} 
                      className="px-6 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                {editingField === 'password' ? (
                  <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                        autoFocus
                      />
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (min 8 characters)"
                          className="w-full px-4 py-3 pr-12 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder=""
                        className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                      />
                    </div>

                    {/* Cancel and Save Buttons */}
                    <div className="flex items-center gap-3">
                      <button 
                        type="button" 
                        onClick={handlePasswordCancel} 
                        className="text-sm font-medium text-gray-700"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        onClick={handlePasswordSave} 
                        className="px-6 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value="No password yet"
                      disabled
                      className="flex-1 px-4 py-3 text-gray-500 bg-gray-50 border border-gray-300 rounded-lg"
                    />
                    <button 
                      type="button" 
                      onClick={handlePasswordEdit} 
                      className="text-sm font-medium text-gray-700"
                    >
                      Create new
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Company Information Section */}
          <section>
            <h2 className="text-base font-bold mb-4 text-gray-900">Company Information</h2>
            <div className="space-y-4">
              {/* Company Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingField === 'companyName' ? tempValue : formData.companyName}
                    onChange={(e) => setTempValue(e.target.value)}
                    disabled={editingField !== 'companyName'}
                    className={`flex-1 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 ${
                      editingField === 'companyName' ? 'bg-white border-gray-400' : ''
                    }`}
                  />
                  {editingField === 'companyName' ? (
                    <button 
                      type="button" 
                      onClick={handleCancelClick} 
                      className="text-sm font-medium text-gray-700"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => handleEditClick('companyName', formData.companyName)} 
                      className="text-sm font-medium text-gray-700"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingField === 'companyName' && (
                  <div className="mt-3">
                    <button 
                      type="button" 
                      onClick={() => handleFieldSave('companyName')} 
                      className="px-6 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              {/* Company Address Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingField === 'companyAddress' ? tempValue : formData.companyAddress}
                    onChange={(e) => setTempValue(e.target.value)}
                    disabled={editingField !== 'companyAddress'}
                    className={`flex-1 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 ${
                      editingField === 'companyAddress' ? 'bg-white border-gray-400' : ''
                    }`}
                  />
                  {editingField === 'companyAddress' ? (
                    <button 
                      type="button" 
                      onClick={handleCancelClick} 
                      className="text-sm font-medium text-gray-700"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => handleEditClick('companyAddress', formData.companyAddress)} 
                      className="text-sm font-medium text-gray-700"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingField === 'companyAddress' && (
                  <div className="mt-3">
                    <button 
                      type="button" 
                      onClick={() => handleFieldSave('companyAddress')} 
                      className="px-6 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </form>
      </div>

      {/* Save Changes Button - Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
        <button
          type="button"
          onClick={handleSaveChanges}
          className="w-full px-8 py-3.5 bg-gray-800 text-white text-base font-bold rounded-lg hover:bg-gray-700 transition-colors"
        >
          Save changes
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
