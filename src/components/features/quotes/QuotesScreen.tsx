
import React, { useState, useMemo, useEffect } from 'react';
import { sampleQuotes } from '@/constants';
import QuoteCard from '@/components/features/quotes/QuoteCard';
import { PlusIcon, ChevronLeftIcon, SearchIcon, CloseIcon } from '@/assets/icons/IconComponents';
import EmptyState from '@/components/common/EmptyState';
import type { Quote } from '@/types';
import { quotesService } from '@/services/api';
import { normalizeApiResponse, isApiResponseSuccess, getApiResponseData } from '@/utils/apiResponseHelper';

interface QuotesScreenProps {
    onNewQuote: () => void;
    onViewQuote: (quoteId: string) => void;
    onEditQuote?: (quoteId: string) => void;
    onDeleteQuote?: (quoteId: string) => void;
    onBack?: () => void;
    refreshTrigger?: number; // Optional prop to trigger refresh
}

type Tab = 'All' | 'Draft' | 'Paid' | 'Unpaid';

const tabs: Tab[] = ['All', 'Draft', 'Paid', 'Unpaid'];

const QuotesScreen: React.FC<QuotesScreenProps> = ({ onNewQuote, onViewQuote, onEditQuote, onDeleteQuote, onBack, refreshTrigger }) => {
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Transform backend quote to frontend Quote format
  const transformBackendQuote = (backendQuote: any): Quote => {
    // Map backend status to frontend status
    const statusMap: Record<string, Quote['status']> = {
      'draft': 'Draft',
      'sent': 'Sent',
      'paid': 'Paid',
      'unpaid': 'Unpaid',
    };

    return {
      id: backendQuote.id.toString(),
      quoteNumber: backendQuote.quoteNumber || `Q-${backendQuote.id}`,
      projectName: backendQuote.project?.projectName || 'Standalone Quote',
      customerName: backendQuote.customerName,
      status: statusMap[backendQuote.status] || 'Draft',
      total: backendQuote.total || 0,
      issueDate: new Date(backendQuote.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
    };
  };

  // Fetch quotes from API
  const fetchQuotes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Determine quoteType based on active tab
      // For now, fetch all quotes and filter client-side
      const response = await quotesService.list(1, 100);

      const normalizedResponse = normalizeApiResponse(response);

      if (isApiResponseSuccess(response)) {
        const responseData = getApiResponseData(response) as any;
        // Handle both response.quotes (list response) and direct array
        const quotesList = responseData?.quotes || (Array.isArray(responseData) ? responseData : []);

        // Transform backend quotes to frontend format
        const transformedQuotes = Array.isArray(quotesList)
          ? quotesList.map(transformBackendQuote)
          : [];

        setQuotes(transformedQuotes);
        console.log('[QuotesScreen] Quotes loaded:', transformedQuotes.length, 'from', quotesList.length, 'backend quotes');
      } else {
        setError('Failed to load quotes');
        // Fallback to empty array
        setQuotes([]);
      }
    } catch (err: any) {
      console.error('[QuotesScreen] Error fetching quotes:', err);
      setError('Failed to load quotes. Please try again.');
      // Fallback to empty array
      setQuotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch quotes on mount and when refreshTrigger changes
  useEffect(() => {
    fetchQuotes();
  }, [refreshTrigger]); // Refetch when refreshTrigger changes

  const filteredQuotes = useMemo(() => {
    let result = quotes;
    if (activeTab !== 'All') {
      result = result.filter(quote => {
        switch (activeTab) {
          case 'Draft':
            return quote.status === 'Draft';
          case 'Paid':
            return quote.status === 'Paid';
          case 'Unpaid':
            return quote.status === 'Sent' || quote.status === 'Accepted';
          default:
            return true;
        }
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(quote =>
        (quote.quoteNumber && quote.quoteNumber.toLowerCase().includes(q)) ||
        (quote.projectName && quote.projectName.toLowerCase().includes(q)) ||
        (quote.customerName && quote.customerName.toLowerCase().includes(q))
      );
    }
    return result;
  }, [activeTab, quotes, searchQuery]);
  
  const getEmptyStateContent = () => {
      switch (activeTab) {
          case 'All':
              return {
                  title: 'No quotes yet.',
                  message: 'Click "New Quote" to get started.',
              };
          case 'Draft':
              return {
                  title: 'No draft quotes.',
                  message: 'Click "New Quote" to begin',
              };
          case 'Paid':
              return {
                  title: 'No paid quotes yet.',
                  message: 'Completed quotes appear here once paid.',
              };
          case 'Unpaid':
              return {
                  title: 'No unpaid quotes.',
                  message: 'All existing quotes are settled!',
              };
      }
  };
  
  const { title, message } = getEmptyStateContent();

  const handleEditQuote = (quote: Quote) => {
    if (onEditQuote) {
      onEditQuote(quote.id);
    }
  };

  const handleDeleteQuote = async (quote: Quote) => {
    if (!onDeleteQuote) return;
    
    if (!window.confirm(`Are you sure you want to delete quote "${quote.quoteNumber}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const quoteIdNum = parseInt(quote.id, 10);
      if (isNaN(quoteIdNum)) {
        setError('Invalid quote ID');
        return;
      }

      const response = await quotesService.delete(quoteIdNum);
      
      const normalizedResponse = normalizeApiResponse(response);
      
      if (normalizedResponse.success || isApiResponseSuccess(response)) {
        // Refresh quotes list
        fetchQuotes();
        // Also call the callback if provided
        onDeleteQuote(quote.id);
      } else {
        setError(normalizedResponse.message || 'Failed to delete quote');
      }
    } catch (err: any) {
      console.error('Error deleting quote:', err);
      setError('Failed to delete quote. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-screen min-h-0 bg-[#FAFAFA]">
        <div className="p-4 lg:p-6 bg-white border-b border-gray-200">
            <div className="max-w-7xl lg:mx-auto">
             <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {onBack && (
                    <button 
                      onClick={onBack}
                      className="text-gray-600 hover:text-gray-900 lg:hover:bg-gray-100 lg:p-2 lg:rounded lg:transition-colors shrink-0"
                      aria-label="Go back"
                    >
                      <ChevronLeftIcon />
                    </button>
                  )}
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      Quotes
                    </h1>
                    <p className="hidden md:block text-sm lg:text-base text-gray-700 mt-1">
                      Create, send, and track quotes for your projects.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSearch(true)}
                  className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                  aria-label="Search quotes"
                >
                  <SearchIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={onNewQuote}
                  className="hidden md:inline-flex px-4 py-2 bg-gray-800 text-white font-semibold rounded hover:bg-gray-700 transition-colors whitespace-nowrap shrink-0"
                >
                  Create New Quote
                </button>
            </div>
            <div className="w-full flex justify-center md:w-auto md:inline-flex md:justify-start bg-gray-100 p-1 rounded-full space-x-1">
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
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 lg:p-8 flex flex-col">
            <div className="max-w-7xl lg:mx-auto w-full min-w-0">
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                        <p className="text-gray-600">Loading quotes...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-800">{error}</p>
                    </div>
                    <button
                        onClick={fetchQuotes}
                        className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
                    >
                        Try again
                    </button>
                </div>
            ) : filteredQuotes.length > 0 ? (
                    /* Multi-column grid */
                    <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
                    {filteredQuotes.map(quote => (
                        <QuoteCard 
                            key={quote.id} 
                            quote={quote} 
                            activeTab={activeTab} 
                            onViewQuote={() => onViewQuote(quote.id)}
                            onEdit={onEditQuote ? () => handleEditQuote(quote) : undefined}
                            onDelete={onDeleteQuote ? () => handleDeleteQuote(quote) : undefined}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title={title}
                    message={message}
                    actionText="Create new quote"
                    onAction={onNewQuote}
                    iconSrc="/icons/quotes-screen-icons-no-quote-yet.svg"
                    actionIcon={<PlusIcon className="w-8 h-8" />}
                />
            )}
            </div>
        </main>

      {/* Floating Action Button - always on mobile; on desktop only when there are quotes */}
      {!isLoading && (
        <button
          onClick={onNewQuote}
          className={`fixed bottom-8 right-8 w-16 h-16 lg:w-20 lg:h-20 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-transform hover:scale-110 z-20 ${filteredQuotes.length === 0 ? 'md:hidden' : ''}`}
          aria-label="Create new quote"
        >
          <div className="lg:scale-125">
            <PlusIcon className="w-8 h-8" />
          </div>
        </button>
      )}

      {/* Search Modal - mobile only */}
      {showSearch && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col md:hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setShowSearch(false)} className="text-gray-600 hover:text-gray-900" aria-label="Close search">
                <ChevronLeftIcon />
              </button>
              <h2 className="text-xl font-bold text-gray-900">Search Quotes</h2>
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by quote number, project, or customer..."
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                autoFocus
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-60" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <CloseIcon />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-sm text-gray-600 mb-3">Results ({filteredQuotes.length})</p>
            {filteredQuotes.length === 0 ? (
              <p className="text-gray-500 py-4">No quotes match your search.</p>
            ) : (
              <div className="space-y-3">
                {filteredQuotes.map(quote => (
                  <QuoteCard
                    key={quote.id}
                    quote={quote}
                    activeTab={activeTab}
                    onViewQuote={() => { setShowSearch(false); onViewQuote(quote.id); }}
                    onEdit={onEditQuote ? () => { setShowSearch(false); onEditQuote(quote.id); } : undefined}
                    onDelete={onDeleteQuote ? () => { setShowSearch(false); onDeleteQuote(quote.id); } : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesScreen;
