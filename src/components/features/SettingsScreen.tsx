
import React, { useState, useEffect } from 'react';
import { 
  ProfileIcon,
  BillingsIcon,
  SubscriptionPlansIcon,
} from '@/assets/icons/IconComponents';
import ProfileScreen from '@/components/features/ProfileScreen';
import BillingScreen from '@/components/features/BillingScreen';
import SubscriptionPlansContent from '@/components/features/SubscriptionPlansContent';

interface SettingsScreenProps {
  onNavigate: (view: string) => void;
  initialSection?: 'profile' | 'billings' | 'subscriptionPlans';
}

interface SettingsNavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const SettingsNavItem: React.FC<SettingsNavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg transition-colors ${
      isActive 
        ? 'bg-gray-100 text-gray-900' 
        : 'text-gray-700 hover:bg-gray-50'
    }`}
    aria-label={`Go to ${label}`}
  >
    <div className="flex-shrink-0">
      {icon}
    </div>
    <span className="text-base font-medium">{label}</span>
  </button>
);

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate, initialSection = 'profile' }) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'billings' | 'subscriptionPlans'>(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const handleSectionChange = (section: 'profile' | 'billings' | 'subscriptionPlans') => {
    setActiveSection(section);
  };

  return (
    <div className="flex flex-col flex-1 bg-white font-sans text-gray-800 overflow-y-auto">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage and track all your estimation projects</p>
      </div>

      {/* Two-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-white flex-shrink-0 p-4">
          <nav className="space-y-1">
            <SettingsNavItem
              icon={<ProfileIcon />}
              label="Profile"
              isActive={activeSection === 'profile'}
              onClick={() => handleSectionChange('profile')}
            />
            <SettingsNavItem
              icon={<BillingsIcon />}
              label="Billings"
              isActive={activeSection === 'billings'}
              onClick={() => handleSectionChange('billings')}
            />
            <SettingsNavItem
              icon={<SubscriptionPlansIcon />}
              label="Subscription Plans"
              isActive={activeSection === 'subscriptionPlans'}
              onClick={() => handleSectionChange('subscriptionPlans')}
            />
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeSection === 'profile' && (
            <ProfileScreen onBack={() => {}} onNavigate={onNavigate} />
          )}
          {activeSection === 'billings' && (
            <BillingScreen onNavigate={onNavigate} />
          )}
          {activeSection === 'subscriptionPlans' && (
            <div className="p-6">
              <SubscriptionPlansContent />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
