import React, { useState } from 'react';
import {
  HomeIcon,
  ProjectsIcon,
  QuotesIcon,
  MaterialListIcon,
  TemplatesIcon,
  HelpIcon,
  FeedbackIcon,
  SettingsIcon,
  LogoutIcon
} from './icons/IconComponents';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  isExpanded: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, label, isActive = false, onClick, isExpanded }) => (
  <a
    href="#"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`flex items-center gap-3 py-3 rounded-lg font-medium transition-all duration-200 ${
      isActive 
        ? 'bg-gray-100 text-gray-900' 
        : 'text-gray-900 hover:bg-gray-50'
    } ${isExpanded ? 'px-4' : 'px-3 justify-center'}`}
  >
    <div className="flex-shrink-0">{icon}</div>
    {isExpanded && <span className="whitespace-nowrap">{label}</span>}
  </a>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onNavigate }) => {
  const handleLogout = () => {
    // In a real app, you would clear tokens, etc.
    // For this demo, we'll just reload to trigger the auth check.
    localStorage.removeItem('isAuthenticated');
    window.location.reload();
  };

  // Expanded when isOpen is true
  const isExpanded = isOpen;

  return (
    <>
      {/* Overlay - Only visible on mobile/tablet when sidebar is open */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Sidebar Panel */}
      <aside
        className={`
          bg-white transition-all duration-300 ease-in-out
          fixed top-1/2 -translate-y-1/2 w-[85%] max-w-md rounded-2xl shadow-2xl z-50 transform
          ${isOpen ? 'left-1/2 -translate-x-1/2 opacity-100' : 'left-[200%] opacity-0 pointer-events-none'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
      >
        <div className="pl-5 pr-4 py-6 max-h-[80vh] overflow-y-auto flex flex-col">
          {/* Logo/Brand Section - Show when expanded */}
          {isExpanded && (
            <div className="flex items-center gap-3 mb-8">
              {/* Logo Icon - Window frame with measurement lines */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="3" y1="6" x2="6" y2="6"></line>
                <line x1="3" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="21" x2="18" y2="18"></line>
                <line x1="12" y1="21" x2="12" y2="18"></line>
              </svg>
              <h2 className="text-lg font-bold text-gray-900">Workings</h2>
            </div>
          )}

          <nav className="flex flex-col space-y-1 flex-1">
            <div>
              {isExpanded && (
                <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Main</h3>
              )}
              <NavLink 
                icon={<HomeIcon isActive={currentView === 'home'} />} 
                label="Home" 
                isActive={currentView === 'home'} 
                onClick={() => onNavigate('home')}
                isExpanded={isExpanded}
              />
              <NavLink 
                icon={<ProjectsIcon />} 
                label="Projects" 
                isActive={currentView === 'projects'} 
                onClick={() => onNavigate('projects')}
                isExpanded={isExpanded}
              />
              <NavLink 
                icon={<QuotesIcon />} 
                label="Quotes" 
                isActive={currentView === 'quotes'} 
                onClick={() => onNavigate('quotes')}
                isExpanded={isExpanded}
              />
              <NavLink 
                icon={<MaterialListIcon />} 
                label="Material List" 
                isActive={currentView === 'material-list'} 
                onClick={() => onNavigate('material-list')}
                isExpanded={isExpanded}
              />
            </div>
            <hr className="border-gray-200 my-1" />
            <div>
            {isExpanded && (
              <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Tools / Resources</h3>
            )}
              <NavLink 
                icon={<TemplatesIcon />} 
                label="Pre-built Templates" 
                isActive={currentView === 'templates'} 
                onClick={() => onNavigate('templates')}
                isExpanded={isExpanded}
              />
            </div>
            <hr className="border-gray-200 my-1" />
            <div>
            {isExpanded && (
              <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Support & Info</h3>
            )}
              <NavLink 
                icon={<HelpIcon />} 
                label="Help & Tips" 
                isActive={currentView === 'help'} 
                onClick={() => onNavigate('help')}
                isExpanded={isExpanded}
              />
              <NavLink 
                icon={<FeedbackIcon />} 
                label="Feedback / Contact Us" 
                isActive={currentView === 'feedback'} 
                onClick={() => onNavigate('feedback')}
                isExpanded={isExpanded}
              />
            </div>
            <hr className="border-gray-200 my-1" />
            <div>
              <NavLink 
                icon={<SettingsIcon />} 
                label="Settings" 
                isActive={currentView === 'settings'} 
                onClick={() => onNavigate('settings')}
                isExpanded={isExpanded}
              />
              <NavLink 
                icon={<LogoutIcon />} 
                label="Log out" 
                onClick={handleLogout}
                isExpanded={isExpanded}
              />
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;