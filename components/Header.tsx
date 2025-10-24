
import React from 'react';
import { HeaderLogo, HamburgerIcon } from './icons/IconComponents';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <HeaderLogo />
        <h1 className="text-2xl font-bold text-gray-800 tracking-wide">Workings</h1>
      </div>
      <button onClick={onMenuClick} className="text-gray-600 hover:text-gray-900" aria-label="Open menu">
          <HamburgerIcon />
      </button>
    </header>
  );
};

export default Header;
