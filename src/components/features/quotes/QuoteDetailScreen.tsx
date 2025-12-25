
import React, { useState, useEffect, useRef } from 'react';
import { formatNaira } from '@/utils/formatters';
import { ChevronLeftIcon, MoreVerticalIcon, EditIcon } from '@/assets/icons/IconComponents';
import { quotesService } from '@/services/api';
import { normalizeApiResponse, isApiResponseSuccess, getApiResponseData } from '@/utils/apiResponseHelper';
import { transformBackendQuoteToPreview } from '@/utils/dataTransformers';
import { exportQuoteToPDF } from '@/services/export/exportService';
import type { QuotePreviewData } from '@/types/quote';

interface QuoteDetailScreenProps {
  quoteId: string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}


const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
        <div className="border-b-2 border-dashed border-gray-200 mb-4"></div>
    </div>
);


const QuoteDetailScreen: React.FC<QuoteDetailScreenProps> = ({ quoteId, onBack, onEdit, onDelete }) => {
  const [quote, setQuote] = useState<QuotePreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  useEffect(() => {
    const fetchQuote = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await quotesService.getById(parseInt(quoteId));
        if (isApiResponseSuccess(response)) {
          const responseData = getApiResponseData(response) as any;
          const backendQuote = responseData?.quote || responseData;
          const previewData = transformBackendQuoteToPreview(backendQuote);
          setQuote(previewData);
        } else {
          setError('Failed to load quote');
        }
      } catch (err: any) {
        console.error('[QuoteDetailScreen] Error fetching quote:', err);
        setError('Failed to load quote. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (quoteId) {
      fetchQuote();
    }
  }, [quoteId]);

  const getDayWithSuffix = (day: number) => {
    if (day > 3 && day < 21) return day + 'th';
    switch (day % 10) {
      case 1:  return day + "st";
      case 2:  return day + "nd";
      case 3:  return day + "rd";
      default: return day + "th";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-800">
        <header className="bg-white p-4 flex justify-between items-center sticky top-0 z-40 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-gray-900" aria-label="Go back">
              <ChevronLeftIcon />
            </button>
            <h1 className="text-2xl font-bold">Quotes</h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-600">Loading quote...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-800">
        <header className="bg-white p-4 flex justify-between items-center sticky top-0 z-40 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-gray-900" aria-label="Go back">
              <ChevronLeftIcon />
            </button>
            <h1 className="text-2xl font-bold">Quotes</h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Quote not found'}</p>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    if (quote) {
      exportQuoteToPDF(quote);
    }
  };

  const handleDeleteQuote = async () => {
    if (!onDelete) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete quote ${quote?.quoteId}? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        const response = await quotesService.delete(parseInt(quoteId));
        if (isApiResponseSuccess(response)) {
          // Call the onDelete callback to handle navigation and refresh
          onDelete();
        } else {
          alert('Failed to delete quote. Please try again.');
        }
      } catch (error: any) {
        console.error('[QuoteDetailScreen] Error deleting quote:', error);
        alert('An error occurred while deleting the quote. Please try again.');
      }
    }
  };

  const date = new Date(quote.issueDate);
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  const formattedDateWithSuffix = `${getDayWithSuffix(day)} ${month}, ${year}`;


  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-800">
      <header className="bg-white p-4 lg:p-6 flex justify-between items-center sticky top-0 z-40 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-gray-900" aria-label="Go back">
            <ChevronLeftIcon />
          </button>
          <h1 className="text-xl lg:text-2xl font-bold">Quote</h1>
        </div>
        <div className="flex items-center gap-3 relative">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
              aria-label="Edit quote"
            >
              <EditIcon />
              <span>Edit</span>
            </button>
          )}
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 text-gray-600 hover:text-gray-900"
              aria-label="More options"
            >
              <MoreVerticalIcon />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => {
                    // TODO: Implement duplicate quote
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Duplicate Quote
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement share quote
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Share Quote
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleDeleteQuote();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete Quote
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl lg:mx-auto">
          {/* Breadcrumbs */}
          <div className="mb-6 text-sm text-gray-400">
            <span className="cursor-pointer hover:text-gray-600">Quotes</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Quote Details</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 lg:p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-4">
              <div>
                <span className="text-gray-600 text-sm">Quote ID:</span>
                <p className="font-medium text-gray-800 text-base mt-1">{quote.quoteId}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Issue Date:</span>
                <p className="font-medium text-gray-800 text-base mt-1">{formattedDateWithSuffix}</p>
              </div>
            </div>
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Completed
              </span>
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-gray-600 text-sm">Billed to:</span>
                <span className="font-medium text-gray-800 text-sm">{quote.customerName}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-600 text-sm">Email Address:</span>
                <span className="font-medium text-gray-800 text-sm">{quote.customerEmail}</span>
              </div>
              <div className="flex items-start gap-2 mt-4">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="font-medium text-gray-800 text-sm">{quote.projectName}</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium text-gray-800 text-sm">{quote.siteAddress}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Item Lists */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Item Lists</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-200">
                        <th className="pb-3 font-medium">Description</th>
                        <th className="pb-3 font-medium text-center">Qty</th>
                        <th className="pb-3 font-medium text-right">Unit Price</th>
                        <th className="pb-3 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.items.map(item => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3 font-medium text-gray-800">{item.description}</td>
                          <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                          <td className="py-3 text-right text-gray-600">{formatNaira(item.unitPrice)}</td>
                          <td className="py-3 text-right font-semibold text-gray-800">{formatNaira(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Summary & Payment */}
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm font-medium text-gray-900">{formatNaira(quote.summary.subtotal)}</span>
                  </div>
                  {quote.summary.charges.map(charge => (
                    <div key={charge.label} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{charge.label}</span>
                      <span className="text-sm font-medium text-gray-900">{formatNaira(charge.amount)}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-900">Grand Total</span>
                      <span className="text-lg font-bold text-gray-900">{formatNaira(quote.summary.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Payment Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Account Name:</p>
                    <p className="text-sm font-medium text-gray-900">{quote.paymentInfo.accountName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Account Number:</p>
                    <p className="text-sm font-medium text-gray-900">{quote.paymentInfo.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Bank Name:</p>
                    <p className="text-sm font-medium text-gray-900">{quote.paymentInfo.bankName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuoteDetailScreen;
