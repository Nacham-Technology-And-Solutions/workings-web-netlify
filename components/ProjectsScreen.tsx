import React from 'react';
import { sampleProjects } from '../constants';
import ProjectCard from './ProjectCard';

const ProjectsScreen: React.FC = () => {
  return (
    <main className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Projects
        </h1>
      </div>
      <div className="space-y-4">
        {sampleProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </main>
  );
};

export default ProjectsScreen;