
import React, { useState } from 'react';
import { 
    ProfileIcon,
    BillingsIcon,
    SubscriptionPlansIcon,
    ChevronRightIcon,
    HamburgerIcon
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
  onClick: () => void;
  showSeparator?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, label, onClick, showSeparator = true }) => (
  <>
    <button
      onClick={onClick}
      className="w-full flex items-center py-4 px-4 bg-white hover:bg-gray-50 transition-colors"
      aria-label={`Go to ${label}`}
    >
      <div className="flex-shrink-0 mr-3 text-gray-900">
        {icon}
      </div>
      <span className="flex-1 text-left text-base font-medium text-gray-900">{label}</span>
      <div className="flex-shrink-0 ml-3">
        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
      </div>
    </button>
    {showSeparator && (
      <div className="border-b border-gray-200"></div>
    )}
  </>
);

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onMenuClick, onNavigate, initialSection = 'profile' }) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'billings' | 'subscriptionPlans' | null>(null);

  const handleItemClick = (section: 'profile' | 'billings' | 'subscriptionPlans') => {
    setActiveSection(section);
  };

  const handleBack = () => {
    setActiveSection(null);
  };

  // If a section is selected, show that section's content
  if (activeSection === 'profile') {
    return (
      <div className="flex flex-col flex-1 bg-white font-sans text-gray-800 overflow-y-auto">
        <ProfileScreen onBack={handleBack} />
      </div>
    );
  }

  if (activeSection === 'billings') {
    return (
      <div className="flex flex-col flex-1 bg-white font-sans text-gray-800 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900 transition-colors mb-4"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Billings</h1>
            <p className="text-gray-600">Billing information and payment history will be displayed here.</p>
          </div>
        </div>
      </div>
    );
  }

  if (activeSection === 'subscriptionPlans') {
    return (
      <div className="flex flex-col flex-1 bg-white font-sans text-gray-800 overflow-y-auto">
        <div className="p-6 mb-6">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 transition-colors mb-4"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Plans</h1>
        </div>
        <SubscriptionPlansContent />
      </div>
    );
  }

  // Main Settings list view
  return (
    <div className="flex flex-col flex-1 bg-white font-sans text-gray-800 overflow-y-auto">
      {/* Header with Hamburger and Title */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center sticky top-0 z-40">
        <button 
          onClick={onMenuClick} 
          className="text-gray-700 hover:text-gray-900 mr-4" 
          aria-label="Open menu"
        >
          <HamburgerIcon />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>
      
      {/* Settings List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <SettingItem
              icon={<ProfileIcon />}
              label="Profile"
              onClick={() => handleItemClick('profile')}
              showSeparator={true}
            />
            <SettingItem
              icon={<BillingsIcon />}
              label="Billings"
              onClick={() => handleItemClick('billings')}
              showSeparator={true}
            />
            <SettingItem
              icon={<SubscriptionPlansIcon />}
              label="Subscription Plans"
              onClick={() => handleItemClick('subscriptionPlans')}
              showSeparator={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
