
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeftIcon, EditIcon, EyeIcon, EyeOffIcon } from '@/assets/icons/IconComponents';
import { useAuthStore } from '@/stores';
import { userService } from '@/services/api';
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
  const userInitials = getUserInitials(user?.name);
  
  const hasPasswordChanged = useMemo(() => newPassword.length > 0, [newPassword]);

  // Fetch fresh user data from API when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        const profileResponse = await userService.getProfile(user.id);
        const normalizedResponse = normalizeApiResponse(profileResponse);

        if (normalizedResponse.success && normalizedResponse.response) {
          const responseData = normalizedResponse.response as any;
          const userProfile = responseData.userProfile || responseData.user || responseData;
          
          // Update auth store with fresh data
          updateUser({
            name: userProfile.name,
            email: userProfile.email,
            companyName: userProfile.companyName,
            subscriptionStatus: userProfile.subscriptionStatus,
          });

          // Update local form data
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


  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your projects, quotes, and lists.'
    );
    
    if (!confirmed) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // TODO: Implement delete account API call when endpoint is available
      // await userService.deleteAccount(user.id);
      console.log('Delete account functionality to be implemented');
      alert('Account deletion functionality will be available soon.');
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans text-gray-800 p-6">
      {isSaving && <LoadingOverlay />}
      
      <div className="flex-1 overflow-y-auto">
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
          
          {/* User Avatar - Right Aligned */}
          <div className="flex justify-end mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center border border-gray-300">
                <span className="text-gray-900 font-bold text-3xl">{userInitials}</span>
              </div>
              <button 
                type="button"
                className="absolute bottom-0 right-0 bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-blue-200 transition-colors" 
                aria-label="Edit profile picture"
              >
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>

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
          <section className="mb-8">
            <h2 className="text-base font-bold mb-4 text-gray-900">Company Information</h2>
            <div className="space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo Upload</label>
                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-xs text-gray-500 text-center px-2">Upload your logo</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">This logo will appear on invoices and email notifications</p>
                  </div>
                </div>
              </div>

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

          {/* Danger Zone Section */}
          <section>
            <h2 className="text-base font-bold mb-4 text-gray-900">Danger Zone</h2>
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 mb-1">Delete Account</p>
                  <p className="text-xs text-red-700">
                    Deleting your account will remove all projects, quotes, and lists permanently.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-6 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors ml-4"
                >
                  Delete
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};

export default ProfileScreen;
