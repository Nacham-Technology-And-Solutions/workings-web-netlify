import React, { useState, useMemo, useEffect } from 'react';
import { sampleProjects } from '../constants';
import ProjectCard from './ProjectCard';
import { ChevronLeftIcon, PlusIcon, SearchIcon, CloseIcon } from './icons/IconComponents';
import type { Project, ProjectStatus } from '../types';

interface ProjectsScreenProps {
  onNewProject?: () => void;
  onBack?: () => void;
}

type Tab = 'All' | 'Draft' | 'Completed';

const tabs: Tab[] = ['All', 'Draft', 'Completed'];

const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ onNewProject, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [projects] = useState<Project[]>(sampleProjects);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [quickFilter, setQuickFilter] = useState<'all' | 'recent' | 'this-month'>('all');

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

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="p-4 lg:p-6 bg-white border-b border-gray-200">
        <div className="max-w-7xl lg:mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={onBack}
              className="text-gray-600 hover:text-gray-900 lg:hover:bg-gray-100 lg:p-2 lg:rounded-lg lg:transition-colors"
            aria-label="Go back"
          >
            <ChevronLeftIcon />
          </button>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex-1">
            Projects
          </h1>
          <button 
            onClick={() => setShowSearch(true)}
              className="text-gray-600 hover:text-gray-900 lg:hover:bg-gray-100 lg:p-2 lg:rounded-lg lg:transition-colors"
            aria-label="Search projects"
          >
            <SearchIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-100 p-1 rounded-full flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
                className={`flex-1 text-center px-4 py-2 lg:px-6 lg:py-2.5 rounded-full text-sm lg:text-base font-semibold transition-colors duration-200 focus:outline-none ${
                activeTab === tab 
                  ? 'bg-gray-800 text-white shadow-sm' 
                  : 'bg-transparent text-gray-600 hover:bg-white/50'
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

      {/* Project List */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
        <div className="max-w-7xl lg:mx-auto">
        {filteredProjects.length === 0 ? (
            <div className="py-12 lg:py-20 text-center text-gray-500">
              <p className="text-lg lg:text-xl mb-2">No projects found</p>
              <p className="text-sm lg:text-base">Try adjusting your search or filters</p>
          </div>
        ) : (
            /* Multi-column grid */
            <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 xl:gap-6 lg:space-y-0">
            {filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
        </div>
      </main>

      {/* Floating Action Button */}
      {onNewProject && (
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
                      <ProjectCard project={project} />
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