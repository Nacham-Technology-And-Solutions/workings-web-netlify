
import React, { useState, useMemo } from 'react';
import { sampleQuotes } from '../constants';
import QuoteCard from './QuoteCard';
import { PlusIcon } from './icons/IconComponents';
import EmptyState from './EmptyState';
import type { Quote } from '../types';

interface QuotesScreenProps {
    onNewQuote: () => void;
    onViewQuote: (quoteId: string) => void;
}

type Tab = 'All' | 'Draft' | 'Paid' | 'Unpaid';

const tabs: Tab[] = ['All', 'Draft', 'Paid', 'Unpaid'];

const QuotesScreen: React.FC<QuotesScreenProps> = ({ onNewQuote, onViewQuote }) => {
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
    <div className="flex flex-col h-full bg-gray-50">
        <div className="p-6 pb-4 bg-white border-b border-gray-200 sticky top-0 z-30">
             <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-800">
                Quotes
                </h1>
            </div>
            <div className="bg-gray-100 p-1 rounded-full flex space-x-1 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 min-w-[70px] text-center px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 focus:outline-none whitespace-nowrap ${
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

        <main className="flex-1 overflow-y-auto p-6 flex flex-col">
            {filteredQuotes.length > 0 ? (
                <div className="space-y-4">
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
        </main>

        <button 
            onClick={onNewQuote}
            className="fixed bottom-8 right-8 w-16 h-16 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-transform transform hover:scale-110"
            aria-label="Create new quote"
        >
            <PlusIcon />
        </button>
    </div>
  );
};

export default QuotesScreen;
