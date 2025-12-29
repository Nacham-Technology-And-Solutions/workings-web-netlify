
import React from 'react';
import { HeaderLogo, HamburgerIcon } from '@/assets/icons/IconComponents';
import { useAuthStore } from '@/stores';
import { getUserInitials } from '@/utils/userHelpers';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuthStore();
  const userInitials = getUserInitials(user?.name);
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      {/* Desktop Header - Show on lg screens and above */}
      <div className="flex items-center justify-between px-6 py-4 w-full">
        {/* Left Section - Logo and Application Name */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <HeaderLogo />
          <span className="hidden lg:inline text-gray-900 font-semibold text-lg">Workings</span>
        </div>
        
        {/* Center Section - Search Bar (hidden on mobile) */}
        <div className="hidden lg:flex flex-1 justify-center px-8 min-w-0">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search projects.."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 bg-white"
            />
          </div>
        </div>
        
        {/* Right Section - User Profile Information (hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <span className="text-sm text-gray-700 font-medium">{user?.email || 'adelekejohn@gmail.com'}</span>
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-700 font-semibold text-sm">{userInitials || 'AJ'}</span>
          </div>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick} 
          className="lg:hidden text-gray-700 hover:text-gray-900 ml-auto" 
          aria-label="Open menu"
        >
          <HamburgerIcon />
        </button>
      </div>
    </header>
  );
};

export default Header;