import React, { useState, useEffect } from 'react';
import { projectsService } from '@/services/api';
import type { Project as ApiProject } from '@/services/api/projects.service';
import Input from '@/components/common/Input';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';
import { extractErrorMessage } from '@/utils/errorHandler';
import { normalizeApiResponse } from '@/utils/apiResponseHelper';
import ErrorMessage from '@/components/common/ErrorMessage';

interface ProjectEditScreenProps {
  projectId: string;
  onBack: () => void;
  onSave?: () => void;
}

const ProjectEditScreen: React.FC<ProjectEditScreenProps> = ({
  projectId,
  onBack,
  onSave,
}) => {
  const [project, setProject] = useState<ApiProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [projectSaved, setProjectSaved] = useState(false);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchProject();
  }, [projectId]);

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
      
      // Normalize API response (backend doesn't send success field)
      const normalizedResponse = normalizeApiResponse(response);
      
      if (normalizedResponse.success && normalizedResponse.response) {
        // The API returns { response: { project: {...} } }
        // So we need to extract the project from the nested structure
        const responseData = normalizedResponse.response as any;
        const proj = responseData.project || responseData;
        setProject(proj);
        // Populate form fields
        setProjectName(proj.projectName);
        setCustomerName(proj.customer.name);
        setCustomerEmail(proj.customer.email || '');
        setCustomerPhone(proj.customer.phone || '');
        setCustomerAddress(proj.customer.address || '');
        setSiteAddress(proj.siteAddress);
        setDescription(proj.description || '');
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

  const handleSave = async () => {
    if (!project) return;

    setIsSaving(true);
    setSaveError(null);
    setProjectSaved(false);

    try {
      const projectIdNum = parseInt(projectId, 10);
      const response = await projectsService.update(projectIdNum, {
        projectName,
        customer: {
          name: customerName,
          email: customerEmail || undefined,
          phone: customerPhone || undefined,
          address: customerAddress || undefined,
        },
        siteAddress,
        description: description || undefined,
      });

      // Normalize API response (backend doesn't send success field)
      const normalizedResponse = normalizeApiResponse(response);
      
      if (normalizedResponse.success && normalizedResponse.response) {
        setProjectSaved(true);
        // Call onSave callback after a brief delay to show success message
        setTimeout(() => {
          if (onSave) {
            onSave();
          } else {
            onBack();
          }
        }, 1500);
      } else {
        setSaveError(response.message || 'Failed to update project');
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setSaveError(typeof errorMessage.message === 'string' 
        ? errorMessage.message 
        : 'Failed to update project');
      console.error('Error updating project:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = projectName.trim() !== '' && customerName.trim() !== '' && siteAddress.trim() !== '';

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
              Edit Project
            </h1>
            <button
              onClick={handleSave}
              disabled={!isFormValid || isSaving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isFormValid && !isSaving
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      {/* Error Messages */}
      {(error || saveError) && (
        <div className="px-4 lg:px-6 pt-4">
          <div className="max-w-4xl mx-auto">
            <ErrorMessage
              message={typeof (error || saveError) === 'string' ? (error || saveError) : 'An unexpected error occurred'}
              onDismiss={() => {
                setError(null);
                setSaveError(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Success Message */}
      {projectSaved && (
        <div className="px-4 lg:px-6 pt-4">
          <div className="max-w-4xl mx-auto">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800 font-medium">Project updated successfully!</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Project Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="projectName"
                label="Project Name"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                className="bg-white border-gray-200"
              />
              <Input
                id="siteAddress"
                label="Site Address"
                placeholder="Enter site address"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                required
                className="bg-white border-gray-200"
              />
              <div className="md:col-span-2">
                <Input
                  id="description"
                  label="Description"
                  placeholder="Enter project description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-white border-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="customerName"
                label="Customer Name"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="bg-white border-gray-200"
              />
              <Input
                id="customerEmail"
                label="Email"
                type="email"
                placeholder="Enter customer email (optional)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="bg-white border-gray-200"
              />
              <Input
                id="customerPhone"
                label="Phone"
                type="tel"
                placeholder="Enter customer phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-white border-gray-200"
              />
              <Input
                id="customerAddress"
                label="Address"
                placeholder="Enter customer address (optional)"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="bg-white border-gray-200"
              />
            </div>
          </div>

          {/* Note about glazing dimensions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Glazing dimensions and calculation settings cannot be edited here. 
              To modify these, please create a new project or recalculate the existing one.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectEditScreen;

