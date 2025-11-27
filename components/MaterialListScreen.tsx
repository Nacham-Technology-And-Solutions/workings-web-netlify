
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeftIcon, ShoppingBagIcon, PlusIcon, SearchIcon, CloseIcon, UserCircleIcon } from './icons/IconComponents';
import { sampleMaterialLists } from '../constants';
import type { MaterialList, MaterialListStatus } from '../types';

interface MaterialListScreenProps {
  onBack: () => void;
  onViewList: (listId: string) => void;
  onCreateNewList: () => void;
}

const statusStyles: Record<MaterialListStatus, string> = {
  Draft: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  Completed: 'bg-green-100 text-green-800 border border-green-200',
};

const getInitials = (name: string): string => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

const MaterialCard: React.FC<{ list: MaterialList; onClick: () => void }> = ({ list, onClick }) => {
  const { projectName, listNumber, status, issueDate } = list;
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(issueDate));

  const initials = getInitials(projectName);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-start gap-4"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 truncate mb-1">{projectName}</h2>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span>{formattedDate}</span>
          <span>•</span>
          <span className="text-gray-600 font-medium">{listNumber}</span>
        </div>
        <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${statusStyles[status]}`}>
          {status}
        </span>
      </div>
    </button>
  );
};

const MaterialListScreen: React.FC<MaterialListScreenProps> = ({ onBack, onViewList, onCreateNewList }) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Draft'>('All');
  const [materialLists] = useState<MaterialList[]>(sampleMaterialLists);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<MaterialListStatus[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [quickFilter, setQuickFilter] = useState<'all' | 'last7' | 'thisMonth'>('all');

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('materialListSearchHistory');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  const filteredLists = useMemo(() => {
    let result = materialLists;

    // Tab filter
    if (activeTab === 'Draft') {
      result = result.filter(list => list.status === 'Draft');
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(list =>
        list.projectName.toLowerCase().includes(query) ||
        list.listNumber.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (selectedStatuses.length > 0 && showSearch) {
      result = result.filter(list => selectedStatuses.includes(list.status));
    }

    // Date range filter
    if (dateRange.start && dateRange.end && showSearch) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      result = result.filter(list => {
        const listDate = new Date(list.issueDate);
        return listDate >= startDate && listDate <= endDate;
      });
    }

    // Quick filter
    if (quickFilter !== 'all' && showSearch) {
      const now = new Date();
      result = result.filter(list => {
        const listDate = new Date(list.issueDate);
        if (quickFilter === 'last7') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return listDate >= sevenDaysAgo;
        } else if (quickFilter === 'thisMonth') {
          return listDate.getMonth() === now.getMonth() && listDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    return result;
  }, [activeTab, materialLists, searchQuery, selectedStatuses, dateRange, quickFilter, showSearch]);

  const hasActiveFilters = selectedStatuses.length > 0 || dateRange.start || dateRange.end || quickFilter !== 'all';

  const toggleStatusFilter = (status: MaterialListStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
      const newHistory = [searchQuery.trim(), ...searchHistory.slice(0, 4)];
      setSearchHistory(newHistory);
      localStorage.setItem('materialListSearchHistory', JSON.stringify(newHistory));
    }
    setShowSearch(false);
  };

  const applySearchHistoryItem = (item: string) => {
    setSearchQuery(item);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatuses([]);
    setDateRange({ start: '', end: '' });
    setQuickFilter('all');
  };

  const emptyStateMessages = {
    All: {
      title: 'No material list yet',
      message: 'Create one now',
    },
    Draft: {
      title: 'No draft material lists',
      message: 'Start a new draft now.',
    },
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
      {/* Content Header */}
      <div className="p-6 lg:p-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl lg:mx-auto">
          {/* Title and Create Button Row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Material List</h1>
              <p className="text-sm lg:text-base text-gray-600">Manage and track all your estimation projects</p>
            </div>
            <button
              onClick={onCreateNewList}
              className="px-4 py-2 lg:px-6 lg:py-2.5 bg-gray-800 text-white text-sm lg:text-base font-semibold rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap ml-4"
            >
              Create New List
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="bg-gray-100 p-1 rounded-full flex items-center w-fit">
            <button
              onClick={() => setActiveTab('All')}
              className={`px-6 py-2 lg:py-2.5 rounded-full text-sm lg:text-base font-semibold transition-colors duration-200 ${activeTab === 'All' ? 'bg-gray-800 text-white shadow' : 'text-gray-600'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('Draft')}
              className={`px-6 py-2 lg:py-2.5 rounded-full text-sm lg:text-base font-semibold transition-colors duration-200 ${activeTab === 'Draft' ? 'bg-gray-800 text-white shadow' : 'text-gray-600'
                }`}
            >
              Draft
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Banner */}
      {hasActiveFilters && !showSearch && (
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-blue-900 font-medium">Filters:</span>
              {selectedStatuses.map(status => (
                <span key={status} className="px-2 py-1 bg-blue-200 text-blue-900 text-xs rounded-full">
                  {status}
                </span>
              ))}
              {quickFilter !== 'all' && (
                <span className="px-2 py-1 bg-blue-200 text-blue-900 text-xs rounded-full">
                  {quickFilter === 'last7' ? 'Last 7 Days' : 'This Month'}
                </span>
              )}
              {(dateRange.start || dateRange.end) && (
                <span className="px-2 py-1 bg-blue-200 text-blue-900 text-xs rounded-full">
                  Date Range
                </span>
              )}
            </div>
            <button
              onClick={resetFilters}
              className="text-blue-900 text-sm font-semibold hover:text-blue-700"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl lg:mx-auto p-6 lg:p-8">
          {filteredLists.length > 0 ? (
            /* Mobile: Vertical list, Desktop: Multi-column grid */
            <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0 pb-24">
              {filteredLists.map(list => (
                <MaterialCard key={list.id} list={list} onClick={() => onViewList(list.id)} />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 min-h-[60vh]">
              {/* Shopping Bag Illustration with Radiating Lines */}
              <div className="relative mb-8">
                {/* Radiating Lines Above */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2">
                  <div className="w-0.5 h-6 bg-blue-200"></div>
                  <div className="w-0.5 h-8 bg-blue-300"></div>
                  <div className="w-0.5 h-6 bg-blue-200"></div>
                </div>
                {/* Shopping Bag Icon */}
                <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100">
                  <ShoppingBagIcon className="w-12 h-12 lg:w-14 lg:h-14 text-blue-400" />
                </div>
              </div>

              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                {emptyStateMessages[activeTab].title}
              </h3>
              <p className="max-w-sm mx-auto mb-12 text-gray-500 text-sm lg:text-base leading-relaxed">
                {emptyStateMessages[activeTab].message}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button - Only show in empty state */}
      {filteredLists.length === 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={onCreateNewList}
            className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-transform transform hover:scale-110"
            aria-label="Create new material list"
          >
            <div className="lg:scale-125">
              <PlusIcon />
            </div>
          </button>
        </div>
      )}

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Search Header */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setShowSearch(false)}
                className="text-gray-600 hover:text-gray-900"
                aria-label="Close search"
              >
                <ChevronLeftIcon />
              </button>
              <h2 className="text-xl font-bold text-gray-900">Search Material Lists</h2>
            </div>

            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project name or list number..."
                className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          </div>

          {/* Search Content */}
          <div className="flex-1 overflow-y-auto p-4 pb-24">
            {/* Recent Searches */}
            {searchHistory.length > 0 && !searchQuery && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Recent Searches
                </h3>
                <div className="space-y-2">
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => applySearchHistoryItem(item)}
                      className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-gray-700">{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Filters */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Filters
              </h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setQuickFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${quickFilter === 'all'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setQuickFilter('last7')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${quickFilter === 'last7'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setQuickFilter('thisMonth')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${quickFilter === 'thisMonth'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  This Month
                </button>
              </div>
            </div>

            {/* Filter by Status */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Filter by Status
              </h3>
              <div className="space-y-2">
                {(['Draft', 'Completed'] as MaterialListStatus[]).map(status => (
                  <label key={status} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => toggleStatusFilter(status)}
                      className="w-5 h-5 text-gray-800 border-gray-300 rounded focus:ring-gray-400"
                    />
                    <span className="text-gray-700 font-medium">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter by Date */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Filter by Date
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Results */}
            {searchQuery && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Results ({filteredLists.length})
                </h3>
                {filteredLists.length > 0 ? (
                  <div className="space-y-3">
                    {filteredLists.map(list => (
                      <MaterialCard
                        key={list.id}
                        list={list}
                        onClick={() => {
                          onViewList(list.id);
                          setShowSearch(false);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No material lists found</p>
                )}
              </div>
            )}
          </div>

          {/* Search Footer */}
          <div className="p-4 bg-white border-t border-gray-200 sticky bottom-0">
            <button
              onClick={handleSearchSubmit}
              className="w-full py-3.5 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Apply Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialListScreen;
