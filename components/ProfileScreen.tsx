
import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, EditIcon, EyeIcon, EyeOffIcon } from './icons/IconComponents';

interface ProfileScreenProps {
  onBack: () => void;
}

const LoadingOverlay: React.FC = () => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity duration-300">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-sky-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-gray-700 font-medium">Saving changes</p>
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
  }

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPasswordChanged) return;
    
    setIsSaving(true);
    setTimeout(() => {
        const newFormData = { ...formData, password: newPassword };
        setFormData(newFormData);
        setInitialData(newFormData);
        setNewPassword('');
        setEditingField(null);
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
    <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
      {isSaving && <LoadingOverlay />}
      <header className="p-4 flex items-center gap-4 sticky top-0 z-40 bg-white border-b border-gray-200">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900" aria-label="Go back">
          <ChevronLeftIcon />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
      </header>

      <main className="flex-1 px-6 overflow-y-auto pb-28">
        <div className="relative w-28 h-28 mx-auto my-8">
          <img 
            src="https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256&h=256&auto=format&fit=crop"
            alt="Profile Avatar"
            className="w-full h-full rounded-full object-cover"
          />
          <button className="absolute bottom-1 right-1 bg-white w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-gray-200 hover:bg-gray-100 transition-colors" aria-label="Edit profile picture">
            <EditIcon className="w-5 h-5 text-blue-600" />
          </button>
        </div>
        
        <form onSubmit={handleSaveChanges}>
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Personal Details</h2>
            <div className="space-y-5">
              {renderField('name', 'Name')}
              {renderField('email', 'Email Address')}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  {editingField === 'password' ? (
                      <button type="button" onClick={handlePasswordCancel} className="text-sm font-medium text-red-600 hover:text-red-800">Cancel</button>
                  ) : (
                      <button type="button" onClick={handlePasswordEdit} className="text-sm font-medium text-gray-600 hover:text-gray-900">{formData.password ? 'Edit' : 'Create new'}</button>
                  )}
                </div>
                {editingField !== 'password' && (
                    <p className="text-sm text-gray-500 mt-1">{formData.password ? '********' : 'No password yet'}</p>
                )}

                {editingField === 'password' && (
                  <div className="mt-2">
                    <label htmlFor="newPassword" className="text-sm font-medium text-gray-700 mb-1 block">New Password</label>
                    <div className="relative">
                        <input
                            id="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={inputClass}
                            placeholder="*************"
                            autoFocus
                        />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700" aria-label={showPassword ? "Hide password" : "Show password"}>
                           {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                         </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-4 text-gray-800">Company Information</h2>
             <div className="space-y-5">
                {renderField('companyName', 'Company Name')}
                {renderField('companyAddress', 'Company Address')}
            </div>
          </section>
        </form>
      </main>

      {!isEditingNonPassword && (
        <footer className="bg-white p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] sticky bottom-0 left-0 w-full z-10 border-t border-gray-200">
            <div className="max-w-md mx-auto">
            <button
                type="submit"
                onClick={handleSaveChanges}
                disabled={!hasPasswordChanged}
                className="w-full py-3.5 text-lg font-semibold text-white bg-gray-800 rounded-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed hover:enabled:bg-gray-700"
            >
                Save changes
            </button>
            </div>
        </footer>
      )}
    </div>
  );
};

export default ProfileScreen;
