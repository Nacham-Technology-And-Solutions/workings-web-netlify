
import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, EditIcon, EyeIcon, EyeOffIcon } from '@/assets/icons/IconComponents';

interface ProfileScreenProps {
  onBack: () => void;
}

const LoadingOverlay: React.FC = () => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity duration-300">
        <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-base text-gray-700 font-medium">Saving changes</p>
        </div>
    </div>
);


const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const [initialData, setInitialData] = useState({
    name: 'Adeleke John Kelechi',
    email: 'adelekejohn@gmail.com',
    password: 'initialpassword', // Use non-empty to show 'Edit' initially
    companyName: 'Adeleke Constructions',
    companyAddress: '123, Main Street, Lagos',
  });

  const [formData, setFormData] = useState(initialData);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const hasPasswordChanged = useMemo(() => newPassword.length > 0, [newPassword]);
  
  const handleEditClick = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleCancelClick = () => {
    setEditingField(null);
    setTempValue('');
  };
  
  const handleFieldSave = (field: string) => {
    const newFormData = { ...formData, [field]: tempValue };
    setFormData(newFormData);
    setInitialData(newFormData); // Persist change
    handleCancelClick();
  };

  const handlePasswordEdit = () => {
    setEditingField('password');
  };
  
  const handlePasswordCancel = () => {
    setEditingField(null);
    setNewPassword('');
    setConfirmPassword('');
  }

  const handlePasswordSave = () => {
    if (newPassword && newPassword === confirmPassword) {
      const newFormData = { ...formData, password: newPassword };
      setFormData(newFormData);
      setInitialData(newFormData);
      setNewPassword('');
      setConfirmPassword('');
      setEditingField(null);
    }
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    // Save any pending changes
    setIsSaving(true);
    setTimeout(() => {
        setIsSaving(false);
        // In a real app, you would show a success toast
    }, 1500);
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
    <div className="flex flex-col bg-white font-sans text-gray-800">
      {isSaving && <LoadingOverlay />}
      
      <div className="flex-1 overflow-y-auto">
        {/* User Avatar */}
        <div className="relative w-24 h-24 mb-8">
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-700 font-semibold text-2xl">AJ</span>
          </div>
          <button 
            className="absolute bottom-0 right-0 bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-md border border-gray-200 hover:bg-gray-100 transition-colors" 
            aria-label="Edit profile picture"
          >
            <EditIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        <form onSubmit={handleSaveChanges}>
          {/* Personal Details Section */}
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-6 text-gray-900">Personal Details</h2>
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editingField === 'name' ? tempValue : formData.name}
                    onChange={(e) => setTempValue(e.target.value)}
                    disabled={editingField !== 'name'}
                    className={`flex-1 px-4 py-3 text-gray-900 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent ${
                      editingField === 'name' ? 'border-gray-900' : 'border-gray-300 disabled:bg-gray-50'
                    }`}
                  />
                  {editingField === 'name' ? (
                    <button 
                      type="button" 
                      onClick={handleCancelClick} 
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => handleEditClick('name', formData.name)} 
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
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
                <div className="flex items-center gap-3">
                  <input
                    type="email"
                    value={editingField === 'email' ? tempValue : formData.email}
                    onChange={(e) => setTempValue(e.target.value)}
                    disabled={editingField !== 'email'}
                    className={`flex-1 px-4 py-3 text-gray-900 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent ${
                      editingField === 'email' ? 'border-gray-900' : 'border-gray-300 disabled:bg-gray-50'
                    }`}
                  />
                  {editingField === 'email' ? (
                    <button 
                      type="button" 
                      onClick={handleCancelClick} 
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => handleEditClick('email', formData.email)} 
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  {editingField === 'password' && (
                    <button 
                      type="button" 
                      onClick={handlePasswordCancel} 
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {editingField === 'password' ? (
                  <div className="space-y-4">
                    {/* Current Password (dashed line) */}
                    <div className="border-b-2 border-dashed border-gray-300 pb-2"></div>
                    
                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="************"
                          className="w-full px-4 py-3 pr-12 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                          autoFocus
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
                        className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                      />
                    </div>

                    {/* Save Button */}
                    <div>
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
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-3 text-gray-500 bg-gray-50 border border-gray-300 rounded-lg">
                      <span>No password yet</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={handlePasswordEdit} 
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
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
            <h2 className="text-lg font-bold mb-6 text-gray-900">Company Information</h2>
            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <button
                    type="button"
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Upload
                  </button>
                  <p className="mt-3 text-sm text-gray-500">
                    This logo will appear on invoices and email
                  </p>
                </div>
              </div>
            </div>
          </section>
        </form>
      </div>

      {/* Save Changes Button */}
      <div className="pt-6 border-t border-gray-200 mt-8">
        <button
          type="button"
          onClick={handleSaveChanges}
          className="w-full px-8 py-3.5 bg-gray-800 text-white text-base font-semibold rounded-lg hover:bg-gray-700 transition-colors"
        >
          Save changes
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
