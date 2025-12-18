import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import ProjectCard from '@/components/features/projects/ProjectCard';
import { ChevronLeftIcon, PlusIcon, SearchIcon, CloseIcon } from '@/assets/icons/IconComponents';
import { projectsService } from '@/services/api';
import type { Project as ApiProject } from '@/services/api/projects.service';
import type { Project, ProjectStatus } from '@/types';
import { extractErrorMessage } from '@/utils/errorHandler';
import { normalizeApiResponse } from '@/utils/apiResponseHelper';
import ErrorMessage from '@/components/common/ErrorMessage';

interface ProjectsScreenProps {
  onNewProject?: () => void;
  onBack?: () => void;
  onViewProject?: (projectId: string) => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onCalculateProject?: (projectId: string) => void;
}

type Tab = 'All' | 'Draft' | 'Completed';

const tabs: Tab[] = ['All', 'Draft', 'Completed'];

// Map API Project status to frontend ProjectStatus
const mapApiStatusToFrontend = (status: ApiProject['status']): ProjectStatus => {
  const statusMap: Record<ApiProject['status'], ProjectStatus> = {
    'draft': 'Draft',
    'calculated': 'Completed',
    'archived': 'On Hold',
  };
  return statusMap[status] || 'Draft';
};

// Transform API Project to frontend Project format
const transformApiProject = (apiProject: ApiProject): Project => {
  return {
    id: apiProject.id.toString(),
    name: apiProject.projectName,
    address: apiProject.siteAddress,
    status: mapApiStatusToFrontend(apiProject.status),
    lastUpdated: apiProject.updatedAt || apiProject.createdAt,
    projectId: `#${String(apiProject.id).padStart(6, '0')}`,
  };
};

const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ 
  onNewProject, 
  onBack, 
  onViewProject,
  onEditProject,
  onDeleteProject,
  onCalculateProject,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Helper to safely set error message (always ensures it's a string)
  const setErrorMessage = (err: unknown) => {
    if (typeof err === 'string') {
      setError(err);
    } else if (err && typeof err === 'object' && 'message' in err) {
      const msg = (err as { message: unknown }).message;
      setError(typeof msg === 'string' ? msg : 'An unexpected error occurred');
    } else {
      const errorMessage = extractErrorMessage(err);
      setError(typeof errorMessage.message === 'string' 
        ? errorMessage.message 
        : 'An unexpected error occurred');
    }
  };
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [quickFilter, setQuickFilter] = useState<'all' | 'recent' | 'this-month'>('all');

  // Track if a request is in progress to prevent duplicates (React StrictMode double-rendering)
  const requestInProgressRef = useRef(false);

  // Fetch projects from API
  const fetchProjects = useCallback(async (search?: string) => {
    // Prevent duplicate concurrent requests (React StrictMode causes double renders in dev)
    if (requestInProgressRef.current) {
      console.warn('[ProjectsScreen] Request already in progress, skipping duplicate');
      return;
    }

    requestInProgressRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if user is authenticated before making request
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        // No token - redirect will happen via API interceptor, don't show error
        setIsLoading(false);
        requestInProgressRef.current = false;
        return;
      }

      const response = await projectsService.list(1, 50, search);
      
      // Normalize the API response - handle both formats
      const normalizedResponse = normalizeApiResponse(response);
      
      if (normalizedResponse.success) {
        const responseData = normalizedResponse.response;
        
        // Handle different response structures
        // API returns: { projects: [...], pagination: {...} }
        // Or: { projects: [...], total: ..., page: ..., limit: ... }
        let projectsArray: any[] = [];
        
        if (responseData && (responseData as any).projects && Array.isArray((responseData as any).projects)) {
          // Standard format: { projects: [...], pagination: {...} }
          projectsArray = (responseData as any).projects;
        } else if (Array.isArray(responseData)) {
          // Sometimes the response might be the array directly
          projectsArray = responseData;
        } else {
          // Invalid format
          setError('Invalid response format from server');
          return;
        }
        
        // Transform and set projects (empty array is valid - means no projects)
        const transformedProjects = projectsArray.map(transformApiProject);
        setProjects(transformedProjects);
      } else {
        // Ensure message is always a string
        const errorMsg = normalizedResponse.message || 'Failed to load projects';
        setError(errorMsg);
      }
    } catch (err: any) {
      // Don't show 401 errors or auth redirect errors - they trigger redirect to login
      if (err?.response?.status === 401 || 
          err?.message?.includes('401') || 
          err?.isAuthError || 
          err?.redirecting) {
        // Authentication error - redirect will happen via API interceptor
        console.log('Authentication required - redirecting to login');
        setIsLoading(false);
        return;
      }
      
      setErrorMessage(err);
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
      requestInProgressRef.current = false;
    }
  }, []);

  // Load projects on mount and when search changes
  useEffect(() => {
    let isMounted = true;
    let abortController: AbortController | null = null;

    const loadProjects = async () => {
      // Prevent duplicate requests
      if (abortController) {
        abortController.abort();
      }
      abortController = new AbortController();

      try {
        await fetchProjects();
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name !== 'AbortError' && isMounted) {
          console.error('Error loading projects:', error);
        }
      }
    };

    loadProjects();

    return () => {
      isMounted = false;
      if (abortController) {
        abortController.abort();
      }
    };
    // Only run on mount, not when fetchProjects changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('projectSearchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  const saveSearchToHistory = (query: string) => {
    if (!query.trim()) return;
    
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5); // Keep last 5
    setSearchHistory(newHistory);
    localStorage.setItem('projectSearchHistory', JSON.stringify(newHistory));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('projectSearchHistory');
  };

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Tab filter
    if (activeTab !== 'All') {
      filtered = filtered.filter(project => project.status === activeTab);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(query) ||
        project.projectId?.toLowerCase().includes(query) ||
        project.status.toLowerCase().includes(query) ||
        project.address.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(project => selectedStatuses.includes(project.status));
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(project => {
        const projectDate = new Date(project.lastUpdated);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        
        if (startDate && projectDate < startDate) return false;
        if (endDate && projectDate > endDate) return false;
        return true;
      });
    }

    // Quick filter
    if (quickFilter === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter(project => new Date(project.lastUpdated) >= sevenDaysAgo);
    } else if (quickFilter === 'this-month') {
      const now = new Date();
      filtered = filtered.filter(project => {
        const projectDate = new Date(project.lastUpdated);
        return projectDate.getMonth() === now.getMonth() && 
               projectDate.getFullYear() === now.getFullYear();
      });
    }

    return filtered;
  }, [activeTab, projects, searchQuery, selectedStatuses, dateRange, quickFilter]);

  const toggleStatusFilter = (status: ProjectStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      saveSearchToHistory(searchQuery);
      fetchProjects(searchQuery.trim());
    } else {
      fetchProjects();
    }
  };

  const applySearchHistoryItem = (query: string) => {
    setSearchQuery(query);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatuses([]);
    setDateRange({ start: '', end: '' });
    setQuickFilter('all');
  };

  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const projectIdNum = parseInt(project.id, 10);
      if (isNaN(projectIdNum)) {
        setError('Invalid project ID');
        return;
      }

      const response = await projectsService.delete(projectIdNum);
      
      // Normalize API response (backend doesn't send success field)
      // If we get here without an error, the delete was successful
      const normalizedResponse = normalizeApiResponse(response);
      
      if (normalizedResponse.success) {
        // Refresh projects list
        fetchProjects(searchQuery || undefined);
      } else {
        setError(normalizedResponse.message || 'Failed to delete project');
      }
    } catch (err) {
      setErrorMessage(err);
      console.error('Error deleting project:', err);
    }
  };

  const handleEditProject = (project: Project) => {
    if (onEditProject) {
      onEditProject(project.id);
    }
  };

  const handleCalculateProject = (project: Project) => {
    if (onCalculateProject) {
      onCalculateProject(project.id);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="p-4 lg:p-6 bg-white border-b border-gray-200">
        <div className="max-w-7xl lg:mx-auto">
          {/* Title and Button Row */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Projects
              </h1>
              <p className="text-sm lg:text-base text-gray-700">
                Manage and track all your estimation projects
              </p>
            </div>
            {onNewProject && (
              <button
                onClick={onNewProject}
                className="px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
              >
                Create New Project
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-gray-100 p-1 rounded-full inline-flex space-x-1">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-full text-base font-semibold transition-colors duration-200 focus:outline-none ${
                  activeTab === tab 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Active Filters Display */}
      {(searchQuery || selectedStatuses.length > 0 || dateRange.start || dateRange.end || quickFilter !== 'all') && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex flex-wrap items-center gap-2">
          <span className="text-xs text-blue-800 font-medium">Active filters:</span>
          {searchQuery && (
            <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
              Search: "{searchQuery}"
            </span>
          )}
          {selectedStatuses.map(status => (
            <span key={status} className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
              Status: {status}
            </span>
          ))}
          {quickFilter !== 'all' && (
            <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
              {quickFilter === 'recent' ? 'Last 7 days' : 'This month'}
            </span>
          )}
          <button 
            onClick={resetFilters}
            className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="px-4 lg:px-6 pt-4">
          <div className="max-w-7xl lg:mx-auto">
            <ErrorMessage
              message={typeof error === 'string' ? error : 'An unexpected error occurred'}
              onDismiss={() => setError(null)}
            />
          </div>
        </div>
      )}

      {/* Project List */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
        <div className="max-w-7xl lg:mx-auto">
        {isLoading ? (
          <div className="py-12 lg:py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-500">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
            <div className="py-12 lg:py-20 flex flex-col items-center justify-center">
              {/* Two overlapping documents icon */}
              <div className="relative mb-6" style={{ width: '96px', height: '96px' }}>
                {/* Back document */}
                <svg className="absolute top-2 left-2 w-20 h-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {/* Front document */}
                <svg className="absolute top-0 left-0 w-20 h-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              {searchQuery || selectedStatuses.length > 0 || dateRange.start || dateRange.end || quickFilter !== 'all' ? (
                <>
                  <p className="text-lg lg:text-xl mb-2 text-gray-500">No projects found</p>
                  <p className="text-sm lg:text-base text-gray-400">
                    Try adjusting your search or filters
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg lg:text-xl mb-8 text-gray-900 font-semibold">
                    Start a project Now!!!
                  </p>
                  {onNewProject && (
                    <button
                      onClick={onNewProject}
                      className="w-20 h-20 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-transform transform hover:scale-110"
                      aria-label="Create new project"
                    >
                      <PlusIcon className="w-8 h-8" />
                    </button>
                  )}
                </>
              )}
          </div>
        ) : (
            /* Multi-column grid */
            <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 xl:gap-6 lg:space-y-0">
            {filteredProjects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project}
                onClick={onViewProject ? () => onViewProject(project.id) : undefined}
                onEdit={onEditProject ? () => handleEditProject(project) : undefined}
                onDelete={onDeleteProject ? () => handleDeleteProject(project) : undefined}
                onCalculate={onCalculateProject ? () => handleCalculateProject(project) : undefined}
              />
            ))}
          </div>
        )}
        </div>
      </main>

      {/* Floating Action Button - Only show when there are projects */}
      {onNewProject && filteredProjects.length > 0 && !isLoading && (
        <button 
          onClick={onNewProject}
          className="fixed bottom-8 right-8 w-16 h-16 lg:w-20 lg:h-20 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-transform transform hover:scale-110 z-20"
          aria-label="Create new project"
        >
          <div className="lg:scale-125">
          <PlusIcon />
          </div>
        </button>
      )}

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Search Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => setShowSearch(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeftIcon />
              </button>
              <h2 className="text-xl font-bold text-gray-900">Search Projects</h2>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                placeholder="Search by name, ID, or status..."
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-60" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          </div>

          {/* Search Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Search History */}
            {searchHistory.length > 0 && !searchQuery && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Recent Searches</h3>
                  <button 
                    onClick={clearSearchHistory}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-2">
                  {searchHistory.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => applySearchHistoryItem(query)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="flex-1">{query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Filters */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Filters</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setQuickFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    quickFilter === 'all'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Projects
                </button>
                <button
                  onClick={() => setQuickFilter('recent')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    quickFilter === 'recent'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setQuickFilter('this-month')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    quickFilter === 'this-month'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Month
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Status</h3>
              <div className="space-y-2">
                {(['Draft', 'In Progress', 'Completed', 'On Hold'] as ProjectStatus[]).map(status => (
                  <label key={status} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => toggleStatusFilter(status)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Date</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Results ({filteredProjects.length})
                </h3>
                {(searchQuery || selectedStatuses.length > 0 || dateRange.start || dateRange.end || quickFilter !== 'all') && (
                  <button 
                    onClick={resetFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
              
              {filteredProjects.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p className="mb-2">No projects found</p>
                  <p className="text-sm">Try different search terms or filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProjects.map(project => (
                    <div key={project.id} onClick={() => setShowSearch(false)}>
                      <ProjectCard 
                        project={project}
                        onClick={onViewProject ? () => {
                          setShowSearch(false);
                          onViewProject(project.id);
                        } : undefined}
                        onEdit={onEditProject ? () => {
                          setShowSearch(false);
                          handleEditProject(project);
                        } : undefined}
                        onDelete={onDeleteProject ? () => {
                          setShowSearch(false);
                          handleDeleteProject(project);
                        } : undefined}
                        onCalculate={onCalculateProject ? () => {
                          setShowSearch(false);
                          handleCalculateProject(project);
                        } : undefined}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Footer */}
          <div className="p-4 bg-white border-t border-gray-200">
            <button
              onClick={() => {
                handleSearchSubmit();
                setShowSearch(false);
              }}
              className="w-full py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Apply Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsScreen;
