
import React from 'react';
import { HamburgerIcon } from './icons/IconComponents';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white border-b border-gray-200 p-4 flex items-center sticky top-0 z-40 relative">
      {/* Logo - Left side */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Logo with window frame icon */}
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
          <h2 className="text-lg font-bold text-gray-900 lowercase">workings</h2>
        </div>
      </div>
      
      {/* Search Bar - Hidden on mobile for now */}
      <div className="hidden">
        <div className="relative">
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
      <div className="flex items-center gap-4 ml-auto flex-shrink-0">
        {/* Hamburger Menu */}
        <button 
          onClick={onMenuClick} 
          className="text-gray-700 hover:text-gray-900" 
          aria-label="Open menu"
        >
        <HamburgerIcon />
    </button>
      </div>
    </header>
  );
};

export default Header;
