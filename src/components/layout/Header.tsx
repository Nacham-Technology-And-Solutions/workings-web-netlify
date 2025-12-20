
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
    <header className="bg-white border-b border-gray-200 min-h-32 max-h-32 h-32 flex items-center sticky top-0 z-40 px-4 lg:px-6 w-full">
      <div className="flex items-center justify-between w-full gap-4">
        {/* Logo - Left Edge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <HeaderLogo />
        </div>

        {/* Right Side: Search Bar and User Profile (aligned to right, hidden on mobile) */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0 ml-auto">
          {/* Search Bar */}
          <div className="flex items-center">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search projects.."
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent text-sm w-64"
              />
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user?.email || 'User'}</span>
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-700 font-semibold text-sm">{userInitials}</span>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Mobile Hamburger Menu (shown only on mobile) */}
        <button
          onClick={onMenuClick}
          className="text-gray-700 hover:text-gray-900 md:hidden ml-auto"
          aria-label="Open menu"
        >
          <HamburgerIcon />
        </button>
      </div>
    </header>
  );
};

export default Header;