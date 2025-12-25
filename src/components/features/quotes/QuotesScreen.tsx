
import React, { useState, useMemo, useEffect } from 'react';
import { sampleQuotes } from '@/constants';
import QuoteCard from '@/components/features/quotes/QuoteCard';
import { PlusIcon, ChevronLeftIcon } from '@/assets/icons/IconComponents';
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
    if (activeTab === 'All') {
      return quotes;
    }
    return quotes.filter(quote => {
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
  }, [activeTab, quotes]);
  
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
    <div className="flex flex-col h-screen bg-[#FAFAFA]">
        <div className="p-4 lg:p-6 bg-white border-b border-gray-200">
            <div className="max-w-7xl lg:mx-auto">
             <div className="flex items-center gap-3 mb-4">
                {onBack && (
                  <button 
                    onClick={onBack}
                        className="text-gray-600 hover:text-gray-900 lg:hover:bg-gray-100 lg:p-2 lg:rounded-lg lg:transition-colors"
                    aria-label="Go back"
                  >
                    <ChevronLeftIcon />
                  </button>
                )}
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex-1">
                Quotes
                </h1>
            </div>
            <div className="bg-gray-100 p-1 rounded-full flex space-x-1 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                            className={`flex-1 min-w-[70px] text-center px-3 py-1.5 lg:px-6 lg:py-2.5 rounded-full text-sm lg:text-base font-semibold transition-colors duration-200 focus:outline-none whitespace-nowrap ${
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
        </div>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col">
            <div className="max-w-7xl lg:mx-auto w-full">
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
                    actionText="New Quote"
                    onAction={onNewQuote}
                />
            )}
            </div>
        </main>

        <button 
            onClick={onNewQuote}
            className="fixed bottom-8 right-8 w-16 h-16 lg:w-20 lg:h-20 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-transform transform hover:scale-110 z-20"
            aria-label="Create new quote"
        >
            <div className="lg:scale-125">
            <PlusIcon />
            </div>
        </button>
    </div>
  );
};

export default QuotesScreen;
