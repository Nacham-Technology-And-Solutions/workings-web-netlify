
import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeOffIcon } from '@/assets/icons/IconComponents';
import { useAuthStore } from '@/stores';
import { authService, userService } from '@/services/api';
import UserAvatar from '@/components/common/UserAvatar';
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


const PASSWORD_RULES_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';

function isValidPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, onNavigate }) => {
  const { user, updateUser, logout } = useAuthStore();
  const [hasPassword, setHasPassword] = useState(user?.hasPassword ?? true);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(user?.companyLogoUrl || null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(user?.profilePhotoUrl || null);
  const [bankDetails, setBankDetails] = useState({
    accountName: user?.bankDetails?.accountName || '',
    accountNumber: user?.bankDetails?.accountNumber || '',
    bankName: user?.bankDetails?.bankName || '',
  });
  const [editingBankDetails, setEditingBankDetails] = useState(false);
  const [initialData, setInitialData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    companyName: user?.companyName || '',
    companyAddress: user?.companyAddress || '',
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
  const applyProfileToState = (userProfile: {
    name?: string;
    email?: string;
    companyName?: string;
    companyAddress?: string | null;
    companyLogoUrl?: string | null;
    profilePhotoUrl?: string | null;
    subscriptionStatus?: string;
    pointsBalance?: number;
    hasPassword?: boolean;
    bankDetails?: { accountName: string; accountNumber: string; bankName: string } | null;
  }) => {
    updateUser({
      name: userProfile.name,
      email: userProfile.email,
      companyName: userProfile.companyName,
      companyAddress: userProfile.companyAddress,
      companyLogoUrl: userProfile.companyLogoUrl,
      profilePhotoUrl: userProfile.profilePhotoUrl,
      subscriptionStatus: userProfile.subscriptionStatus as any,
      pointsBalance: userProfile.pointsBalance,
      hasPassword: userProfile.hasPassword,
      bankDetails: userProfile.bankDetails,
    });

    const newInitialData = {
      name: userProfile.name || '',
      email: userProfile.email || '',
      companyName: userProfile.companyName || '',
      companyAddress: userProfile.companyAddress || '',
    };
    setInitialData(newInitialData);
    setFormData(newInitialData);
    setCompanyLogoPreview(userProfile.companyLogoUrl || null);
    setProfilePhotoPreview(userProfile.profilePhotoUrl || null);
    setHasPassword(userProfile.hasPassword ?? true);
    if (userProfile.bankDetails) {
      setBankDetails(userProfile.bankDetails);
    }
  };

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
          applyProfileToState(userProfile);
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
        companyName: user.companyName || '',
        companyAddress: user.companyAddress || '',
      };
      setInitialData(newInitialData);
      setFormData(newInitialData);
      setCompanyLogoPreview(user.companyLogoUrl || null);
      setProfilePhotoPreview(user.profilePhotoUrl || null);
      setHasPassword(user.hasPassword ?? true);
      if (user.bankDetails) {
        setBankDetails(user.bankDetails);
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

    setIsSaving(true);
    setError(null);

    try {
      const updateData: {
        name?: string;
        email?: string;
        companyName?: string;
        companyAddress?: string;
      } = {};

      if (field === 'name') updateData.name = tempValue;
      if (field === 'email') updateData.email = tempValue;
      if (field === 'companyName') updateData.companyName = tempValue;
      if (field === 'companyAddress') updateData.companyAddress = tempValue;

      const apiResponse = await userService.updateProfile(user.id, updateData);
      if (isApiResponseSuccess(apiResponse)) {
        const responseData = getApiResponseData(apiResponse);
        const userProfile = (responseData as { user?: unknown }).user || responseData;
        applyProfileToState(userProfile as Parameters<typeof applyProfileToState>[0]);
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

  const handleCompanyLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Logo file size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result as string;
      setIsSaving(true);
      setError(null);
      try {
        const apiResponse = await userService.updateProfile(user.id, { companyLogoUrl: result });
        if (isApiResponseSuccess(apiResponse)) {
          const responseData = getApiResponseData(apiResponse);
          const userProfile = (responseData as { user?: unknown }).user || responseData;
          applyProfileToState(userProfile as Parameters<typeof applyProfileToState>[0]);
          setCompanyLogoPreview(result);
        } else {
          setError(getApiResponseMessage(apiResponse) || 'Failed to upload company logo');
        }
      } catch (err) {
        setError(extractErrorMessage(err).message);
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCompanyLogo = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
      const apiResponse = await userService.updateProfile(user.id, { companyLogoUrl: null });
      if (isApiResponseSuccess(apiResponse)) {
        const responseData = getApiResponseData(apiResponse);
        const userProfile = (responseData as { user?: unknown }).user || responseData;
        applyProfileToState(userProfile as Parameters<typeof applyProfileToState>[0]);
        setCompanyLogoPreview(null);
      } else {
        setError(getApiResponseMessage(apiResponse) || 'Failed to remove company logo');
      }
    } catch (err) {
      setError(extractErrorMessage(err).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photo must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result as string;
      setIsSaving(true);
      setError(null);
      try {
        const apiResponse = await userService.updateProfile(user.id, { profilePhotoUrl: result });
        if (isApiResponseSuccess(apiResponse)) {
          const responseData = getApiResponseData(apiResponse);
          const userProfile = (responseData as { user?: unknown }).user || responseData;
          applyProfileToState(userProfile as Parameters<typeof applyProfileToState>[0]);
          setProfilePhotoPreview(result);
        } else {
          setError(getApiResponseMessage(apiResponse) || 'Failed to upload profile photo');
        }
      } catch (err) {
        setError(extractErrorMessage(err).message);
      } finally {
        setIsSaving(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePhoto = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
      const apiResponse = await userService.updateProfile(user.id, { profilePhotoUrl: null });
      if (isApiResponseSuccess(apiResponse)) {
        const responseData = getApiResponseData(apiResponse);
        const userProfile = (responseData as { user?: unknown }).user || responseData;
        applyProfileToState(userProfile as Parameters<typeof applyProfileToState>[0]);
        setProfilePhotoPreview(null);
      } else {
        setError(getApiResponseMessage(apiResponse) || 'Failed to remove profile photo');
      }
    } catch (err) {
      setError(extractErrorMessage(err).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBankDetailsSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
      const apiResponse = await userService.updateBankDetails(user.id, bankDetails);
      if (isApiResponseSuccess(apiResponse)) {
        const responseData = getApiResponseData(apiResponse);
        const userData = (responseData as { user?: { bankDetails?: typeof bankDetails } }).user;
        if (userData?.bankDetails) {
          setBankDetails(userData.bankDetails);
          updateUser({ bankDetails: userData.bankDetails });
        }
        setEditingBankDetails(false);
      } else {
        setError(getApiResponseMessage(apiResponse) || 'Failed to update bank details');
      }
    } catch (err) {
      setError(extractErrorMessage(err).message);
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

    if (!isValidPassword(newPassword)) {
      setError(PASSWORD_RULES_MESSAGE);
      return;
    }

    if (hasPassword && !currentPassword) {
      setError('Current password is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const apiResponse = hasPassword
        ? await userService.changePassword(user.id, {
            currentPassword: currentPassword,
            newPassword: newPassword,
          })
        : await userService.setPassword(user.id, { newPassword });

      if (isApiResponseSuccess(apiResponse)) {
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
        setHasPassword(true);
        updateUser({ hasPassword: true });
        setEditingField(null);
      } else {
        const errorMsg = getApiResponseMessage(apiResponse) || 'Failed to update password';
        setError(errorMsg);
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
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const typed = window.prompt('Type DELETE to deactivate your account. Your data will be retained but you will lose access.');
    if (typed !== 'DELETE') return;

    setIsSaving(true);
    setError(null);

    try {
      const apiResponse = await userService.deactivateAccount(user.id);
      if (isApiResponseSuccess(apiResponse)) {
        try {
          await authService.logout();
        } catch {
          // Continue with local logout even if API fails
        }
        logout();
      } else {
        setError(getApiResponseMessage(apiResponse) || 'Failed to deactivate account');
      }
    } catch (err) {
      setError(extractErrorMessage(err).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans text-gray-800 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6">
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
          
          {/* Profile photo */}
          <div className="flex flex-col items-center lg:items-start mb-6 sm:mb-8">
            <div className="relative">
              <UserAvatar
                name={user?.name}
                email={user?.email}
                photoUrl={profilePhotoPreview}
                size="md"
              />
              <label
                className="absolute bottom-0 right-0 bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-blue-200 transition-colors cursor-pointer"
                aria-label="Upload profile photo"
              >
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfilePhotoUpload}
                />
              </label>
            </div>
            {profilePhotoPreview && (
              <button
                type="button"
                onClick={handleRemoveProfilePhoto}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-800 underline"
              >
                Remove photo
              </button>
            )}
            <p className="mt-2 text-xs text-gray-500 text-center lg:text-left">PNG or JPG, max 5MB</p>
          </div>

          {/* Personal Details Section */}
          <section className="mb-8">
            <h2 className="text-base font-bold mb-4 text-gray-900">Personal Details</h2>
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  {editingField === 'name' ? (
                    <button type="button" onClick={handleCancelClick} className="text-sm font-medium text-gray-700">Cancel</button>
                  ) : (
                    <button type="button" onClick={() => handleEditClick('name', formData.name)} className="text-sm font-medium text-gray-700">Edit</button>
                  )}
                </div>
                <input
                  type="text"
                  value={editingField === 'name' ? tempValue : formData.name}
                  onChange={(e) => setTempValue(e.target.value)}
                  disabled={editingField !== 'name'}
                  className={`w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 ${
                    editingField === 'name' ? 'bg-white border-gray-400' : ''
                  }`}
                />
                {editingField === 'name' && (
                  <div className="mt-3">
                    <button 
                      type="button" 
                      onClick={() => handleFieldSave('name')} 
                      className="px-6 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded hover:bg-gray-700 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              {/* Email Address Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  {editingField === 'email' ? (
                    <button type="button" onClick={handleCancelClick} className="text-sm font-medium text-gray-700">Cancel</button>
                  ) : (
                    <button type="button" onClick={() => handleEditClick('email', formData.email)} className="text-sm font-medium text-gray-700">Edit</button>
                  )}
                </div>
                <input
                  type="email"
                  value={editingField === 'email' ? tempValue : formData.email}
                  onChange={(e) => setTempValue(e.target.value)}
                  disabled={editingField !== 'email'}
                  className={`w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 ${
                    editingField === 'email' ? 'bg-white border-gray-400' : ''
                  }`}
                />
                {editingField === 'email' && (
                  <div className="mt-3">
                    <button 
                      type="button" 
                      onClick={() => handleFieldSave('email')} 
                      className="px-6 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded hover:bg-gray-700 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  {editingField === 'password' ? (
                    <button type="button" onClick={handlePasswordCancel} className="text-sm font-medium text-gray-700">Cancel</button>
                  ) : (
                    <button type="button" onClick={handlePasswordEdit} className="text-sm font-medium text-gray-700">
                      {hasPassword ? 'Change password' : 'Set password'}
                    </button>
                  )}
                </div>
                {editingField === 'password' ? (
                  <div className="space-y-4">
                    {hasPassword && (
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
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {hasPassword ? 'New Password' : 'Password'}
                      </label>
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
                        className="px-6 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded hover:bg-gray-700 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={hasPassword ? '••••••••' : 'No password set (social sign-in)'}
                    disabled
                    className="w-full px-4 py-3 text-gray-500 bg-gray-50 border border-gray-300 rounded-lg"
                  />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <label className="w-full sm:w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors flex-shrink-0 overflow-hidden">
                    {companyLogoPreview ? (
                      <img src={companyLogoPreview} alt="Company logo" className="max-h-full max-w-full object-contain p-2" />
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-xs text-gray-500 text-center px-2">Upload your logo</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleCompanyLogoUpload} />
                  </label>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm text-gray-600">
                      Used on exports when you choose &quot;Company logo&quot; in Export settings.
                    </p>
                    {companyLogoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveCompanyLogo}
                        className="text-sm font-medium text-red-700 hover:text-red-900"
                      >
                        Remove logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Name Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Company Name</label>
                  {editingField === 'companyName' ? (
                    <button type="button" onClick={handleCancelClick} className="text-sm font-medium text-gray-700">Cancel</button>
                  ) : (
                    <button type="button" onClick={() => handleEditClick('companyName', formData.companyName)} className="text-sm font-medium text-gray-700">Edit</button>
                  )}
                </div>
                <input
                  type="text"
                  value={editingField === 'companyName' ? tempValue : formData.companyName}
                  onChange={(e) => setTempValue(e.target.value)}
                  disabled={editingField !== 'companyName'}
                  className={`w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 ${
                    editingField === 'companyName' ? 'bg-white border-gray-400' : ''
                  }`}
                />
                {editingField === 'companyName' && (
                  <div className="mt-3">
                    <button type="button" onClick={() => handleFieldSave('companyName')} className="px-6 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded hover:bg-gray-700 transition-colors">Save</button>
                  </div>
                )}
              </div>

              {/* Company Address Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Company Address</label>
                  {editingField === 'companyAddress' ? (
                    <button type="button" onClick={handleCancelClick} className="text-sm font-medium text-gray-700">Cancel</button>
                  ) : (
                    <button type="button" onClick={() => handleEditClick('companyAddress', formData.companyAddress)} className="text-sm font-medium text-gray-700">Edit</button>
                  )}
                </div>
                <input
                  type="text"
                  value={editingField === 'companyAddress' ? tempValue : formData.companyAddress}
                  onChange={(e) => setTempValue(e.target.value)}
                  disabled={editingField !== 'companyAddress'}
                  className={`w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 ${
                    editingField === 'companyAddress' ? 'bg-white border-gray-400' : ''
                  }`}
                />
                {editingField === 'companyAddress' && (
                  <div className="mt-3">
                    <button type="button" onClick={() => handleFieldSave('companyAddress')} className="px-6 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded hover:bg-gray-700 transition-colors">Save</button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-bold mb-4 text-gray-900">Bank Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Used on quotes and payment instructions.</p>
                {!editingBankDetails ? (
                  <button
                    type="button"
                    onClick={() => setEditingBankDetails(true)}
                    className="text-sm font-medium text-gray-700"
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingBankDetails(false)}
                    className="text-sm font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                <input
                  type="text"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  disabled={!editingBankDetails}
                  className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  disabled={!editingBankDetails}
                  className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  disabled={!editingBankDetails}
                  className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg disabled:bg-gray-50"
                />
              </div>
              {editingBankDetails && (
                <button
                  type="button"
                  onClick={handleBankDetailsSave}
                  className="px-6 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded hover:bg-gray-700 transition-colors"
                >
                  Save Bank Details
                </button>
              )}
            </div>
          </section>

          {/* Danger Zone Section */}
          <section>
            <h2 className="text-base font-bold mb-4 text-gray-900">Danger Zone</h2>
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-900 mb-1">Delete Account</p>
                  <p className="text-xs text-red-700">
                    Deactivating your account will sign you out. Your data is retained but you will no longer have access.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-6 py-2.5 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors w-full sm:w-auto flex-shrink-0"
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
