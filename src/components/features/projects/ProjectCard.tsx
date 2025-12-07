import React from 'react';
import type { Project, ProjectStatus } from '@/types';

interface ProjectCardProps {
  project: Project;
}

const statusStyles: Record<ProjectStatus, string> = {
  'In Progress': 'text-blue-600',
  'Completed': 'text-green-600',
  'On Hold': 'text-yellow-600',
  'Draft': 'text-gray-500',
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
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-3">
        {/* Avatar with Initials */}
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <span className="text-gray-700 font-semibold text-sm">
            {getInitials(name)}
          </span>
        </div>
        
        {/* Project Details */}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900 mb-1 truncate">{name}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>{formattedDate}</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span>{projectId || `#${project.id}`}</span>
          </div>
          <p className={`text-sm font-medium ${statusStyles[status]}`}>
            {status}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
