
import React from 'react';
import type { Quote, QuoteStatus } from '../types';

interface QuoteCardProps {
  quote: Quote;
  activeTab: 'All' | 'Draft' | 'Paid' | 'Unpaid';
  onViewQuote: () => void;
}

const statusStyles: Record<QuoteStatus, string> = {
  'Draft': 'bg-gray-200 text-gray-800',
  'Sent': 'bg-sky-100 text-sky-800',
  'Accepted': 'bg-blue-100 text-blue-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Paid': 'bg-green-100 text-green-800',
};

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, activeTab, onViewQuote }) => {
  const { quoteNumber, projectName, status, total, issueDate } = quote;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(issueDate));
  
  const formattedTotal = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(total).replace('NGN', '₦');

  // Conditional status text based on the active tab, as per screenshots.
  const statusText = status === 'Paid' && activeTab !== 'Paid' ? 'Completed' : status;
  
  const canViewDetail = status === 'Paid';

  return (
    <button
      onClick={onViewQuote}
      disabled={!canViewDetail}
      className="w-full text-left bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-3 disabled:opacity-70 disabled:hover:shadow-sm disabled:cursor-not-allowed"
    >
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-semibold text-gray-900 pr-4">{projectName}</h2>
        <p className="text-lg font-bold text-gray-900 whitespace-nowrap">{formattedTotal}</p>
      </div>
      <div className="flex items-center text-sm text-gray-500">
        <span>{formattedDate}</span>
        <span className="mx-2">•</span>
        <span>{quoteNumber}</span>
      </div>
      <div>
        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${statusStyles[status]}`}>
          {statusText}
        </span>
      </div>
    </button>
  );
};

export default QuoteCard;
