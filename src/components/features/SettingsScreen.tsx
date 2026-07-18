import React, { useState, useEffect } from 'react';
import {
  ProfileIcon,
  BillingsIcon,
  SubscriptionPlansIcon,
  ExportSettingsIcon,
  HamburgerIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/assets/icons/IconComponents';
import ProfileScreen from '@/components/features/ProfileScreen';
import BillingScreen from '@/components/features/BillingScreen';
import SubscriptionPlansContent from '@/components/features/SubscriptionPlansContent';
import ExportSettingsSection from '@/components/features/settings/ExportSettingsSection';
import {
  getStoredSettingsSection,
  setStoredSettingsSection,
  isSettingsSectionView,
  type SettingsSection,
} from '@/utils/settingsNavigation';

interface SettingsScreenProps {
  onNavigate: (view: string) => void;
  onMenuClick?: () => void;
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

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate, onMenuClick }) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    () => getStoredSettingsSection() ?? 'profile'
  );

  const [mobileActiveSection, setMobileActiveSection] = useState<SettingsSection | null>(() => {
    if (typeof window !== 'undefined') {
      const direct = sessionStorage.getItem('settingsDirectSection');
      if (direct && isSettingsSectionView(direct)) {
        sessionStorage.removeItem('settingsDirectSection');
        return direct;
      }
    }
    return null;
  });

  useEffect(() => {
    const handleSync = () => {
      const direct = sessionStorage.getItem('settingsDirectSection');
      if (direct && isSettingsSectionView(direct)) {
        sessionStorage.removeItem('settingsDirectSection');
        setMobileActiveSection(direct);
        setActiveSection(direct);
      }
    };
    handleSync();
  }, []);

  useEffect(() => {
    const stored = getStoredSettingsSection();
    if (stored) {
      setActiveSection(stored);
    }
  }, []);

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
    setStoredSettingsSection(section);
  };

  const handleMobileSectionChange = (section: SettingsSection) => {
    setMobileActiveSection(section);
    handleSectionChange(section);
  };

  const handleMobileBack = () => {
    setMobileActiveSection(null);
  };

  return (
    <div className="flex flex-col flex-1 bg-white font-sans text-gray-800 overflow-hidden min-h-0">
      
      {/* HEADER SECTION */}
      {/* Desktop Header - Hidden on Mobile */}
      <div className="hidden lg:block bg-white border-b border-gray-200 px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-base text-gray-600">Manage your profile, billing, and app preferences</p>
      </div>

      {/* Mobile Header - Hidden on Desktop */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between sticky top-0 z-50">
        {mobileActiveSection === null ? (
          <div className="flex items-center w-full">
            <button
              onClick={onMenuClick}
              className="text-gray-700 hover:text-gray-900 mr-3 flex items-center justify-center"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          </div>
        ) : (
          <div className="flex items-center w-full">
            <button
              onClick={handleMobileBack}
              className="text-gray-700 hover:text-gray-900 mr-3 flex items-center justify-center"
              aria-label="Back to settings list"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {mobileActiveSection === 'profile' && 'Profile'}
              {mobileActiveSection === 'billings' && 'Billings'}
              {mobileActiveSection === 'subscriptionPlans' && 'Subscription Plans'}
              {mobileActiveSection === 'exportSettings' && 'Export settings'}
            </h1>
          </div>
        )}
      </div>

      {/* TWO COLUMN VIEW FOR DESKTOP */}
      <div className="hidden lg:flex flex-row flex-1 overflow-hidden min-h-0">
        {/* Left Navigation Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-white flex-shrink-0 p-4">
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
              icon={<ExportSettingsIcon />}
              label="Export settings"
              isActive={activeSection === 'exportSettings'}
              onClick={() => handleSectionChange('exportSettings')}
            />
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 px-2 lg:px-6 py-6">
          {activeSection === 'profile' && (
            <ProfileScreen onBack={() => {}} onNavigate={onNavigate} />
          )}
          {activeSection === 'billings' && (
            <BillingScreen onNavigate={onNavigate} onSectionChange={handleSectionChange} />
          )}
          {activeSection === 'subscriptionPlans' && (
            <div>
              <SubscriptionPlansContent isActive={activeSection === 'subscriptionPlans'} />
            </div>
          )}
          {activeSection === 'exportSettings' && (
            <div className="flex-1 flex flex-col min-h-0">
              <ExportSettingsSection onNavigate={onNavigate} />
            </div>
          )}
        </div>
      </div>

      {/* MOBILE LIST & VIEW STACK */}
      <div className="lg:hidden flex-1 overflow-y-auto min-h-0 flex flex-col">
        {mobileActiveSection === null ? (
          <div className="flex-1 bg-white px-4 py-4 divide-y divide-gray-100">
            <button
              onClick={() => handleMobileSectionChange('profile')}
              className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                  <ProfileIcon />
                </div>
                <span className="text-base font-semibold text-gray-800">Profile</span>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => handleMobileSectionChange('billings')}
              className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                  <BillingsIcon />
                </div>
                <span className="text-base font-semibold text-gray-800">Billings</span>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => handleMobileSectionChange('subscriptionPlans')}
              className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                  <SubscriptionPlansIcon />
                </div>
                <span className="text-base font-semibold text-gray-800">Subscription Plans</span>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => handleMobileSectionChange('exportSettings')}
              className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                  <ExportSettingsIcon />
                </div>
                <span className="text-base font-semibold text-gray-800">Export settings</span>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        ) : (
          <div className="flex-1 bg-white">
            {mobileActiveSection === 'profile' && (
              <ProfileScreen onBack={handleMobileBack} onNavigate={onNavigate} />
            )}
            {mobileActiveSection === 'billings' && (
              <BillingScreen onNavigate={onNavigate} onSectionChange={handleSectionChange} />
            )}
            {mobileActiveSection === 'subscriptionPlans' && (
              <div className="p-4">
                <SubscriptionPlansContent isActive={mobileActiveSection === 'subscriptionPlans'} />
              </div>
            )}
            {mobileActiveSection === 'exportSettings' && (
              <div className="flex-grow flex flex-col min-h-0 p-4">
                <ExportSettingsSection onNavigate={onNavigate} />
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default SettingsScreen;
