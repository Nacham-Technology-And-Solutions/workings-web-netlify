import React from 'react';
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
}

const NavLink: React.FC<NavLinkProps> = ({ icon, label, isActive = false, onClick }) => (
  <a
    href="#"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 font-medium transition-colors ${
      isActive ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50'
    }`}
  >
    {icon}
    <span>{label}</span>
  </a>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onNavigate }) => {
  const handleLogout = () => {
    // In a real app, you would clear tokens, etc.
    // For this demo, we'll just reload to trigger the auth check.
    localStorage.removeItem('isAuthenticated');
    window.location.reload();
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-4/5 max-w-xs bg-white rounded-r-2xl shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
      >
        <div className="p-6 pt-12">
          <nav className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 px-4 mb-2">Main</h3>
              <NavLink icon={<HomeIcon isActive={currentView === 'home'} />} label="Home" isActive={currentView === 'home'} onClick={() => onNavigate('home')} />
              <NavLink icon={<ProjectsIcon />} label="Projects" isActive={currentView === 'projects'} onClick={() => onNavigate('projects')} />
              <NavLink icon={<QuotesIcon />} label="Quotes" isActive={currentView === 'quotes'} onClick={() => onNavigate('quotes')} />
              <NavLink icon={<MaterialListIcon />} label="Material List" isActive={currentView === 'material-list'} onClick={() => onNavigate('material-list')} />
            </div>
            <hr />
            <div>
              <h3 className="text-sm font-semibold text-gray-400 px-4 mb-2">Tools / Resources</h3>
              <NavLink icon={<TemplatesIcon />} label="Pre-built Templates" isActive={currentView === 'templates'} onClick={() => onNavigate('templates')} />
            </div>
            <hr />
            <div>
              <h3 className="text-sm font-semibold text-gray-400 px-4 mb-2">Support & Info</h3>
              <NavLink icon={<HelpIcon />} label="Help & Tips" isActive={currentView === 'help'} onClick={() => onNavigate('help')} />
              <NavLink icon={<FeedbackIcon />} label="Feedback / Contact Us" isActive={currentView === 'feedback'} onClick={() => onNavigate('feedback')} />
            </div>
            <hr />
            <div>
              <NavLink icon={<SettingsIcon />} label="Settings" isActive={currentView === 'settings'} onClick={() => onNavigate('settings')} />
              <NavLink icon={<LogoutIcon />} label="Log out" onClick={handleLogout} />
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;