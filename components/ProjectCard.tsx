import React from 'react';
import type { Project, ProjectStatus } from '../types';
import { MoreVerticalIcon } from './icons/IconComponents';

interface ProjectCardProps {
  project: Project;
}

const statusStyles: Record<ProjectStatus, string> = {
  'In Progress': 'bg-secondary/10 text-secondary',
  'Completed': 'bg-green-100 text-green-800',
  'On Hold': 'bg-yellow-100 text-yellow-800',
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { name, address, status, lastUpdated } = project;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(lastUpdated));

  return (
    <div className="bg-main border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-between">
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-lg font-semibold text-text-primary truncate">{name}</h2>
          <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusStyles[status]}`}>
            {status}
          </span>
        </div>
        <p className="text-sm text-text-secondary truncate">{address}</p>
        <p className="text-xs text-text-tertiary mt-2">Last updated: {formattedDate}</p>
      </div>
      <button 
        className="p-2 text-text-tertiary hover:bg-background-tertiary rounded-full"
        aria-label={`Actions for ${name}`}
      >
        <MoreVerticalIcon />
      </button>
    </div>
  );
};

export default ProjectCard;
