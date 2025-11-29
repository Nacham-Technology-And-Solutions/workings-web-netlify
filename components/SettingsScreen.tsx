
import React, { useState } from 'react';
import { 
    ProfileIcon,
    BillingsIcon,
  SubscriptionPlansIcon
} from './icons/IconComponents';
import ProfileScreen from './ProfileScreen';
import SubscriptionPlansContent from './SubscriptionPlansContent';

interface SettingsScreenProps {
  onMenuClick: () => void;
  onNavigate: (view: string) => void;
  initialSection?: 'profile' | 'billings' | 'subscriptionPlans';
}

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center text-left p-4 rounded-lg transition-colors font-sans ${
      isActive
        ? 'bg-gray-100 text-gray-900'
        : 'text-gray-900 hover:bg-gray-50'
    }`}
    aria-label={`Go to ${label} settings`}
  >
    <div className="mr-3 text-gray-900">
      {icon}
    </div>
    <span className="text-base font-medium text-gray-900">{label}</span>
  </button>
);

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onMenuClick, onNavigate, initialSection = 'profile' }) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'billings' | 'subscriptionPlans'>(initialSection);

  const handleSectionChange = (section: 'profile' | 'billings' | 'subscriptionPlans') => {
    setActiveSection(section);
    // Don't navigate away from settings - keep all sections within the settings interface
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl lg:mx-auto p-6 lg:p-8">
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Left Navigation - Settings Sub-navigation */}
            <div className="lg:col-span-1 mb-6 lg:mb-0">
              <nav className="bg-white rounded-lg p-2 space-y-1">
                <SettingItem
                  icon={<ProfileIcon />}
                  label="Profile"
                  isActive={activeSection === 'profile'}
                  onClick={() => handleSectionChange('profile')}
                />
                <SettingItem
                  icon={<BillingsIcon />}
                  label="Billings"
                  isActive={activeSection === 'billings'}
                  onClick={() => handleSectionChange('billings')}
                />
                <SettingItem
                  icon={<SubscriptionPlansIcon />}
                  label="Subscription Plans"
                  isActive={activeSection === 'subscriptionPlans'}
                  onClick={() => handleSectionChange('subscriptionPlans')}
                />
              </nav>
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-3">
              {/* Settings Title and Subtitle */}
              <div className="mb-6 lg:mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                <p className="text-sm lg:text-base text-gray-600">Manage and track all your estimation projects</p>
              </div>

              {activeSection === 'profile' && (
                <ProfileScreen onBack={() => { }} />
              )}
              {activeSection === 'subscriptionPlans' && (
                <SubscriptionPlansContent />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsScreen;
