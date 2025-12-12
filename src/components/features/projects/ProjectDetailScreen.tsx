import React, { useState, useEffect } from 'react';
import { projectsService } from '@/services/api';
import type { Project as ApiProject } from '@/services/api/projects.service';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';
import { extractErrorMessage } from '@/utils/errorHandler';
import { normalizeApiResponse } from '@/utils/apiResponseHelper';
import ErrorMessage from '@/components/common/ErrorMessage';

interface ProjectDetailScreenProps {
  projectId: string;
  onBack: () => void;
  onEdit?: (projectId: string) => void;
  onDelete?: () => void;
  onCalculate?: (projectId: string) => void;
}

const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  projectId,
  onBack,
  onEdit,
  onDelete,
  onCalculate,
}) => {
  const [project, setProject] = useState<ApiProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  // Refresh project when coming back from edit
  const handleEditComplete = () => {
    fetchProject();
  };

  const fetchProject = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const projectIdNum = parseInt(projectId, 10);
      if (isNaN(projectIdNum)) {
        setError('Invalid project ID');
        return;
      }

      const response = await projectsService.getById(projectIdNum);
      
      // Debug: Log the raw response
      console.log('Raw API response:', response);
      
      // Normalize API response (backend doesn't send success field)
      const normalizedResponse = normalizeApiResponse(response);
      
      console.log('Normalized response:', normalizedResponse);
      
      if (normalizedResponse.success && normalizedResponse.response) {
        // The API returns { response: { project: {...} } }
        // So we need to extract the project from the nested structure
        const responseData = normalizedResponse.response as any;
        const projectData = responseData.project || responseData;
        
        console.log('Extracted project data:', projectData);
        setProject(projectData);
      } else {
        setError(normalizedResponse.message || 'Failed to load project');
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(typeof errorMessage.message === 'string' 
        ? errorMessage.message 
        : 'Failed to load project');
      console.error('Error fetching project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    setIsDeleting(true);
    try {
      const projectIdNum = parseInt(projectId, 10);
      const response = await projectsService.delete(projectIdNum);
      
      // Normalize API response (backend doesn't send success field)
      // If we get here without an error, the delete was successful
      const normalizedResponse = normalizeApiResponse(response);
      
      if (normalizedResponse.success) {
        if (onDelete) {
          onDelete();
        } else {
          onBack();
        }
      } else {
        setError(response.message || 'Failed to delete project');
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(typeof errorMessage.message === 'string' 
        ? errorMessage.message 
        : 'Failed to delete project');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-500">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="p-4 border-b border-gray-200">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
            <ChevronLeftIcon />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <ErrorMessage
            message={error}
            onDismiss={() => {
              setError(null);
              onBack();
            }}
          />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="p-4 border-b border-gray-200">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
            <ChevronLeftIcon />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Project not found</p>
        </div>
      </div>
    );
  }

  const statusBadgeStyles: Record<string, string> = {
    'draft': 'bg-gray-100 text-gray-800',
    'calculated': 'bg-green-100 text-green-800',
    'archived': 'bg-yellow-100 text-yellow-800',
  };

  // Safely get status with fallback
  const projectStatus = project.status || 'draft';
  const statusDisplay = projectStatus && typeof projectStatus === 'string' 
    ? projectStatus.charAt(0).toUpperCase() + projectStatus.slice(1)
    : 'Draft';
  const statusBadgeClass = statusBadgeStyles[projectStatus] || statusBadgeStyles['draft'];

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="p-4 lg:p-6 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 lg:hover:bg-gray-100 lg:p-2 lg:rounded-lg lg:transition-colors"
              aria-label="Go back"
            >
              <ChevronLeftIcon />
            </button>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex-1">
              {project.projectName || 'Untitled Project'}
            </h1>
            <span className={`px-3 py-1 rounded-md text-sm font-medium ${statusBadgeClass}`}>
              {statusDisplay}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {onCalculate && (
              <button
                onClick={() => onCalculate(projectId)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Calculate
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(projectId)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="px-4 lg:px-6 pt-4">
          <div className="max-w-4xl mx-auto">
            <ErrorMessage
              message={typeof error === 'string' ? error : 'An unexpected error occurred'}
              onDismiss={() => setError(null)}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Project Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Project Name</label>
                <p className="text-gray-900 mt-1">{project.projectName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Site Address</label>
                <p className="text-gray-900 mt-1">{project.siteAddress || 'N/A'}</p>
              </div>
              {project.description && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 mt-1">{project.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          {project.customer && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer Name</label>
                  <p className="text-gray-900 mt-1">{project.customer.name || 'N/A'}</p>
                </div>
                {project.customer.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900 mt-1">{project.customer.email}</p>
                  </div>
                )}
                {project.customer.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900 mt-1">{project.customer.phone}</p>
                  </div>
                )}
                {project.customer.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900 mt-1">{project.customer.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calculation Settings */}
          {project.calculationSettings && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Calculation Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Stock Length</label>
                  <p className="text-gray-900 mt-1">{project.calculationSettings.stockLength || 6}m</p>
                </div>
                 <div>
                   <label className="text-sm font-medium text-gray-500">Blade Kerf</label>
                   <p className="text-gray-900 mt-1">{(project.calculationSettings.bladeKerf || project.calculationSettings.bladekerf || 5)}mm</p>
                 </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Waste Threshold</label>
                  <p className="text-gray-900 mt-1">{project.calculationSettings.wasteThreshold || 200}mm</p>
                </div>
              </div>
            </div>
          )}

          {/* Glazing Dimensions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Glazing Dimensions ({project.glazingDimensions?.length || 0})
            </h2>
            {!project.glazingDimensions || project.glazingDimensions.length === 0 ? (
              <p className="text-gray-500">No glazing dimensions added yet.</p>
            ) : (
              <div className="space-y-3">
                {project.glazingDimensions.map((dimension, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{dimension.glazingType || 'N/A'}</h3>
                        <p className="text-sm text-gray-500">
                          {dimension.glazingCategory || 'N/A'} • {dimension.moduleId || 'N/A'}
                        </p>
                      </div>
                    </div>
                    {dimension.parameters && Object.keys(dimension.parameters).length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                        {Object.entries(dimension.parameters).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-xs text-gray-500">{key}:</span>
                            <span className="text-sm text-gray-900 ml-1">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Metadata */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900 mt-1">
                  {project.createdAt 
                    ? new Date(project.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-gray-900 mt-1">
                  {project.updatedAt 
                    ? new Date(project.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
              {project.lastCalculatedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Calculated</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(project.lastCalculatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Calculated</label>
                <p className="text-gray-900 mt-1">{project.calculated ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Project</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{project.projectName}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailScreen;

