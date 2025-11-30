import React from 'react';
import type { Project, ProjectStatus } from '../types';

interface ProjectCardProps {
  project: Project;
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

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { name, status, lastUpdated, projectId } = project;

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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 h-full flex flex-col">
      {/* Row 1 (Header): Avatar + Status Badge */}
      <div className="flex justify-between items-start mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-semibold text-xs">
          {getInitials(name)}
        </div>
        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusBadgeStyles[status]}`}>
          {status}
        </span>
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
