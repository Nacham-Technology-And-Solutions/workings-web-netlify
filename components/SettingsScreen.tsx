
import React from 'react';
import { 
    HamburgerIcon,
    ProfileIcon,
    BillingsIcon,
    SubscriptionPlansIcon,
    ChevronRightIcon
} from './icons/IconComponents';

interface SettingsScreenProps {
  onMenuClick: () => void;
  onNavigate: (view: string) => void;
}

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, label, onClick }) => (
  <li className="border-b border-gray-200">
    <button
      onClick={onClick}
      className="w-full flex items-center text-left p-4 hover:bg-gray-50 transition-colors"
      aria-label={`Go to ${label} settings`}
    >
      <div className="text-gray-600 mr-4">
        {icon}
      </div>
      <span className="flex-1 text-base font-medium text-gray-800">{label}</span>
      <div className="text-gray-400">
        <ChevronRightIcon />
      </div>
    </button>
  </li>
);

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onMenuClick, onNavigate }) => {
  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
      <header className="bg-white p-4 flex items-center sticky top-0 z-40 border-b border-gray-200">
        <button onClick={onMenuClick} className="text-gray-600 hover:text-gray-900" aria-label="Open menu">
          <HamburgerIcon />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex-1 text-center pr-6">Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        <nav className="mt-4">
          <ul>
            <SettingItem
              icon={<ProfileIcon />}
              label="Profile"
              onClick={() => onNavigate('profile')}
            />
            <SettingItem
              icon={<BillingsIcon />}
              label="Billings"
              onClick={() => onNavigate('billings')}
            />
            <SettingItem
              icon={<SubscriptionPlansIcon />}
              label="Subscription Plans"
              onClick={() => onNavigate('subscriptionPlans')}
            />
          </ul>
        </nav>
      </main>
    </div>
  );
};

export default SettingsScreen;
