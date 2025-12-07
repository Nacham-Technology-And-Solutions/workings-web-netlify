
import React from 'react';
import { HeaderLogo, HamburgerIcon } from '@/assets/icons/IconComponents';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white border-b border-gray-200 p-4 lg:p-6 flex justify-between items-center sticky top-0 z-40">
      <div className="flex items-center gap-4 lg:gap-6 flex-1 max-w-7xl lg:mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <HeaderLogo />
        </div>
        
        {/* Search Bar - Center */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search projects.."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent text-sm"
            />
          </div>
        </div>
        
        {/* User Info - Right */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Desktop User Info */}
          <div className="hidden lg:flex items-center gap-3">
            <span className="text-sm text-gray-600">adelekejohn@gmail.com</span>
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-700 font-semibold text-sm">AJ</span>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {/* Mobile Hamburger Menu */}
          <button 
            onClick={onMenuClick} 
            className="text-gray-700 hover:text-gray-900 lg:hidden" 
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;