
import React, { useState, useMemo } from 'react';
import { sampleQuotes } from '@/constants';
import QuoteCard from '@/components/features/quotes/QuoteCard';
import { PlusIcon, ChevronLeftIcon } from '@/assets/icons/IconComponents';
import EmptyState from '@/components/common/EmptyState';
import type { Quote } from '@/types';

interface QuotesScreenProps {
    onNewQuote: () => void;
    onViewQuote: (quoteId: string) => void;
    onBack?: () => void;
}

type Tab = 'All' | 'Draft' | 'Paid' | 'Unpaid';

const tabs: Tab[] = ['All', 'Draft', 'Paid', 'Unpaid'];

const QuotesScreen: React.FC<QuotesScreenProps> = ({ onNewQuote, onViewQuote, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('All');

  const [quotes] = useState<Quote[]>(sampleQuotes);

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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
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
                {filteredQuotes.length > 0 ? (
                    /* Mobile: Vertical list, Desktop: Multi-column grid */
                    <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
                        {filteredQuotes.map(quote => (
                            <QuoteCard key={quote.id} quote={quote} activeTab={activeTab} onViewQuote={() => onViewQuote(quote.id)} />
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
