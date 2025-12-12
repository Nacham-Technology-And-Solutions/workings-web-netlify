import React, { useState, useRef, useEffect } from 'react';
import type { Project, ProjectStatus } from '@/types';

interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onCalculate?: (project: Project) => void;
}

const statusStyles: Record<ProjectStatus, string> = {
  'In Progress': 'text-blue-600',
  'Completed': 'text-green-600',
  'On Hold': 'text-yellow-600',
  'Draft': 'text-gray-500',
};

const statusBadgeStyles: Record<ProjectStatus, string> = {
  'In Progress': 'bg-blue-100 text-blue-800',
  'Completed': 'bg-green-100 text-green-800',
  'On Hold': 'bg-yellow-100 text-yellow-800',
  'Draft': 'bg-gray-100 text-gray-800',
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onEdit, onDelete, onCalculate }) => {
  const { name, status, lastUpdated, projectId } = project;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(lastUpdated));

  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on menu
    if ((e.target as HTMLElement).closest('.project-menu')) {
      return;
    }
    if (onClick) {
      onClick(project);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (action: 'edit' | 'delete' | 'calculate', e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (action === 'edit' && onEdit) {
      onEdit(project);
    } else if (action === 'delete' && onDelete) {
      onDelete(project);
    } else if (action === 'calculate' && onCalculate) {
      onCalculate(project);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div 
      onClick={handleClick}
      className={`bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 h-full flex flex-col relative ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Row 1 (Header): Avatar + Status Badge + Menu */}
      <div className="flex justify-between items-start mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-semibold text-xs">
          {getInitials(name)}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusBadgeStyles[status]}`}>
            {status}
          </span>
          {/* Actions Menu */}
          {(onEdit || onDelete || onCalculate) && (
            <div className="relative project-menu" ref={menuRef}>
              <button
                onClick={handleMenuClick}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                aria-label="Project actions"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-8 z-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                  {onClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onClick(project);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={(e) => handleAction('edit', e)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  )}
                  {onCalculate && (
                    <button
                      onClick={(e) => handleAction('calculate', e)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Calculate
                    </button>
                  )}
                  {onDelete && (
                    <>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={(e) => handleAction('delete', e)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2 (Content): Title + Description */}
      <div className="flex-1">
        <h2 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-1">{name}</h2>
        <p className="text-sm text-gray-500 line-clamp-2">
          Window glazing and frame installation project
        </p>
      </div>

      {/* Row 3 (Footer/Meta): Date + ID */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
        <span>{formattedDate}</span>
        <span>•</span>
        <span>{projectId || `#${project.id}`}</span>
      </div>
    </div>
  );
};

export default ProjectCard;
