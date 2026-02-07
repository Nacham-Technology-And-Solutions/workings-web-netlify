
import React, { useState, useEffect } from 'react';
import {
  ProfileIcon,
  BillingsIcon,
  SubscriptionPlansIcon,
  TemplatesIcon,
} from '@/assets/icons/IconComponents';
import ProfileScreen from '@/components/features/ProfileScreen';
import BillingScreen from '@/components/features/BillingScreen';
import SubscriptionPlansContent from '@/components/features/SubscriptionPlansContent';
import ExportSettingsSection from '@/components/features/settings/ExportSettingsSection';

interface SettingsScreenProps {
  onNavigate: (view: string) => void;
  initialSection?: 'profile' | 'billings' | 'subscriptionPlans' | 'exportSettings';
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

/** Compact tab pill for mobile horizontal tab bar */
const SettingsTabPill: React.FC<SettingsNavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
      isActive 
        ? 'bg-gray-800 text-white' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
    aria-label={`Go to ${label}`}
  >
    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">{icon}</span>
    <span>{label}</span>
  </button>
);

type SettingsSection = 'profile' | 'billings' | 'subscriptionPlans' | 'exportSettings';

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate, initialSection = 'profile' }) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
  };

  return (
    <div className="flex flex-col flex-1 bg-white font-sans text-gray-800 overflow-y-auto min-h-0">
      {/* Page Header - responsive padding */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Settings</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage and track all your estimation projects</p>
      </div>

      {/* Mobile: Horizontal tab bar (scrollable) */}
      <div className="lg:hidden border-b border-gray-200 bg-white sticky top-0 z-10 px-2 py-3 safe-area-inset">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <SettingsTabPill
            icon={<ProfileIcon />}
            label="Profile"
            isActive={activeSection === 'profile'}
            onClick={() => handleSectionChange('profile')}
          />
          <SettingsTabPill
            icon={<BillingsIcon />}
            label="Billings"
            isActive={activeSection === 'billings'}
            onClick={() => handleSectionChange('billings')}
          />
          <SettingsTabPill
            icon={<SubscriptionPlansIcon />}
            label="Plans"
            isActive={activeSection === 'subscriptionPlans'}
            onClick={() => handleSectionChange('subscriptionPlans')}
          />
          <SettingsTabPill
            icon={<TemplatesIcon />}
            label="Export settings"
            isActive={activeSection === 'exportSettings'}
            onClick={() => handleSectionChange('exportSettings')}
          />
        </div>
      </div>

      {/* Two-Column Layout on desktop; single column on mobile */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
        {/* Left Navigation Sidebar - hidden on mobile (we use tab bar above) */}
        <div className="hidden lg:flex w-64 border-r border-gray-200 bg-white flex-shrink-0 p-4">
          <nav className="space-y-1 w-full">
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
            <SettingsNavItem
              icon={<TemplatesIcon />}
              label="Export settings"
              isActive={activeSection === 'exportSettings'}
              onClick={() => handleSectionChange('exportSettings')}
            />
          </nav>
        </div>

        {/* Right Content Area - full width on mobile, scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeSection === 'profile' && (
            <ProfileScreen onBack={() => {}} onNavigate={onNavigate} />
          )}
          {activeSection === 'billings' && (
            <BillingScreen onNavigate={onNavigate} />
          )}
          {activeSection === 'subscriptionPlans' && (
            <div className="p-4 sm:p-6">
              <SubscriptionPlansContent />
            </div>
          )}
          {activeSection === 'exportSettings' && (
            <div className="flex-1 flex flex-col min-h-0">
              <ExportSettingsSection onNavigate={onNavigate} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
