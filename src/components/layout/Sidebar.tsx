import React, { useState, useEffect } from 'react';
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
} from '@/assets/icons/IconComponents';
import { authService } from '@/services/api';
import { useAuthStore } from '@/stores';
import { getUserInitials, getDisplayName } from '@/utils/userHelpers';

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
        ? 'bg-[#F2F2F2] text-gray-900' 
        : 'text-gray-700 hover:bg-gray-50'
    } ${isExpanded ? 'px-4' : 'px-3 justify-center'}`}
  >
    <div className="flex-shrink-0">{icon}</div>
    {isExpanded && <span className="whitespace-nowrap">{label}</span>}
  </a>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onNavigate }) => {
  const { user, logout: logoutStore } = useAuthStore();
  const userName = getDisplayName(user?.name, user?.email);
  const userInitials = getUserInitials(user?.name);
  const [isDesktop, setIsDesktop] = useState(() => {
    // Initialize desktop state immediately during SSR-safe check
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  // Check if we're on desktop (lg breakpoint = 1024px)
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => {
      window.removeEventListener('resize', checkDesktop);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout API to invalidate tokens on server
      await authService.logout();
    } catch (error) {
      // Even if API call fails, clear local storage and logout
      console.error('Logout API error:', error);
    } finally {
      // Update auth store
      logoutStore();
      // Navigate to login
      window.location.href = '/';
    }
  };

  // On mobile: always expanded when open. On desktop: always expanded (no collapse)
  const isExpanded = isDesktop ? true : isOpen;

  return (
    <>
      {/* Overlay - Only visible on mobile/tablet when sidebar is open */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ease-in-out lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Sidebar Panel - Mobile: Centered modal, Desktop: Fixed left sidebar with toggle */}
      <aside
        className={`
          bg-white z-50
          transition-all duration-300 ease-in-out
          fixed
          
          /* Mobile & Tablet: Centered modal slide-in */
          top-1/2 -translate-y-1/2 w-[85%] max-w-md rounded-2xl shadow-2xl
          ${isOpen ? 'left-1/2 -translate-x-1/2 opacity-100 pointer-events-auto' : 'left-[200%] opacity-0 pointer-events-none'}
          
          /* Desktop: Fixed left sidebar - positioned below header with 24px left margin, 312px width */
          lg:left-6 lg:top-32 lg:translate-x-0 lg:translate-y-0 lg:w-[312px] lg:h-[calc(100vh-8rem)] lg:rounded-none lg:shadow-lg lg:border-r lg:border-gray-200 lg:opacity-100 lg:pointer-events-auto
        `}
        role="dialog"
        aria-modal={!isDesktop}
        aria-label="Main menu"
      >
        <div className="pl-5 pr-4 py-6 max-h-[80vh] lg:max-h-full lg:h-full overflow-y-auto flex flex-col">


          <nav className="space-y-1 flex-1">
            <div>
              {isExpanded && (
                <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide px-4">Main</h3>
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
            <hr className="border-gray-200 my-2" />
            <div>
              {isExpanded && (
                <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide px-4">Tools / Resources</h3>
              )}
              <NavLink 
                icon={<TemplatesIcon />} 
                label="Pre-built Templates" 
                isActive={currentView === 'templates'} 
                onClick={() => onNavigate('templates')}
                isExpanded={isExpanded}
              />
            </div>
            <hr className="border-gray-200 my-2" />
            <div>
              {isExpanded && (
                <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide px-4">Support & Info</h3>
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
            <hr className="border-gray-200 my-2" />
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
          
          {/* Desktop User Info Section at Bottom - Only show when expanded */}
          {isExpanded && (
            <div className="hidden lg:block mt-auto pt-6">
              <div className="py-3 bg-gray-50 rounded-lg transition-opacity duration-300">
                <div className="flex items-center gap-3 px-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-700 font-semibold text-sm">{userInitials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.companyName || 'Company'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;