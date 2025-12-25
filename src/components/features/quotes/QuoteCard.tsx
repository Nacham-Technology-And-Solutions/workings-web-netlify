
import React, { useState, useRef, useEffect } from 'react';
import type { Quote, QuoteStatus } from '@/types';

interface QuoteCardProps {
  quote: Quote;
  activeTab: 'All' | 'Draft' | 'Paid' | 'Unpaid';
  onViewQuote: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const statusStyles: Record<QuoteStatus, string> = {
  'Draft': 'bg-background-tertiary text-text-primary',
  'Sent': 'bg-secondary/10 text-secondary',
  'Accepted': 'bg-blue-100 text-blue-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Paid': 'bg-green-100 text-green-800',
};

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, activeTab, onViewQuote, onEdit, onDelete }) => {
  const { quoteNumber, projectName, status, total, issueDate } = quote;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on menu
    if ((e.target as HTMLElement).closest('.quote-menu')) {
      return;
    }
    onViewQuote();
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (action: 'edit' | 'delete', e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (action === 'edit' && onEdit) {
      onEdit();
    } else if (action === 'delete' && onDelete) {
      onDelete();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div
      onClick={handleClick}
      className={`w-full text-left bg-main border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-3 relative ${onViewQuote ? 'cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-semibold text-text-primary pr-4 flex-1">{projectName}</h2>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-text-primary whitespace-nowrap">{formattedTotal}</p>
          {/* Actions Menu */}
          {(onEdit || onDelete) && (
            <div className="relative quote-menu" ref={menuRef}>
              <button
                onClick={handleMenuClick}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                aria-label="Quote actions"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-8 z-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                  {onViewQuote && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onViewQuote();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={(e) => handleAction('edit', e)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={(e) => handleAction('delete', e)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center text-sm text-text-secondary">
        <span>{formattedDate}</span>
        <span className="mx-2">•</span>
        <span>{quoteNumber}</span>
      </div>
      <div>
        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${statusStyles[status]}`}>
          {statusText}
        </span>
      </div>
    </div>
  );
};

export default QuoteCard;
