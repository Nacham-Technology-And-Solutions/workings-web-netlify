import React, { useState } from 'react';
import { formatNaira } from '@/utils/formatters';
import type { QuotePreviewData } from '@/types';
import { ChevronLeftIcon, EditIcon, FolderIcon, LocationIcon, MoreVerticalIcon } from '@/assets/icons/IconComponents';

interface QuotePreviewScreenProps {
  quote: QuotePreviewData;
  onBack: () => void;
  onEdit: () => void;
}


const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
        <div className="border-b-2 border-dashed border-gray-200 mb-4"></div>
    </div>
);

const QuotePreviewScreen: React.FC<QuotePreviewScreenProps> = ({ quote, onBack, onEdit }) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleExportOption = async (option: 'pdf' | 'excel' | 'share') => {
    setShowExportModal(false);
    
    try {
      if (option === 'pdf') {
        // PDF export logic would go here
        showSuccessMessage('Quote exported as PDF successfully!');
      } else if (option === 'excel') {
        // Excel export logic would go here
        showSuccessMessage('Quote exported to Excel successfully!');
      } else if (option === 'share') {
        // Share logic would go here
        const shareText = `Quote for ${quote.projectName}\nTotal: ${formatNaira(quote.summary.grandTotal)}\nQuote ID: ${quote.quoteId}`;
        if (navigator.share) {
          await navigator.share({ title: 'Quote', text: shareText });
        } else {
          await navigator.clipboard.writeText(shareText);
          showSuccessMessage('Quote details copied to clipboard!');
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportMessage({ type: 'error', text: 'Failed to export. Please try again.' });
      setTimeout(() => setExportMessage(null), 3000);
    }
  };

  const showSuccessMessage = (message: string) => {
    setExportMessage({ type: 'success', text: message });
    setTimeout(() => setExportMessage(null), 3000);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-800">
      {/* Success/Error Message */}
      {exportMessage && (
        <div
          className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-slide-down ${
            exportMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <p className="text-white font-medium text-center">{exportMessage.text}</p>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-gray-900" aria-label="Go back">
            <ChevronLeftIcon />
          </button>
          <h1 className="text-2xl font-bold">Quote Preview</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900" aria-label="Edit quote">
            <EditIcon />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="p-2 text-gray-600 hover:text-gray-900"
            aria-label="Export options"
          >
            <MoreVerticalIcon />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-24">
        <div className="max-w-3xl mx-auto">
            {/* Project Info Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-8 space-y-3">
                <div className="flex items-start gap-3 text-gray-700">
                    <FolderIcon className="w-6 h-6 flex-shrink-0 mt-0.5 text-gray-400" />
                    <span className="font-medium">{quote.projectName}</span>
                </div>
                 <div className="flex items-start gap-3 text-gray-700">
                    <LocationIcon className="w-6 h-6 flex-shrink-0 mt-0.5 text-gray-400" />
                    <span className="font-medium">{quote.siteAddress}</span>
                </div>
            </div>

            {/* Customers' Information */}
            <section className="mb-8">
                <SectionHeader title="CUSTOMERS' INFORMATION" />
                <div className="space-y-3 text-base">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Customer's name:</span>
                        <span className="font-medium text-gray-800">{quote.customerName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Customer's email address:</span>
                        <span className="font-medium text-gray-800">{quote.customerEmail}</span>
                    </div>
                </div>
            </section>

            {/* Quote Information */}
            <section className="mb-8">
                <SectionHeader title="QUOTE INFORMATION" />
                <div className="space-y-3 text-base">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Quote ID:</span>
                        <span className="font-medium text-gray-800">{quote.quoteId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Issue Date:</span>
                        <span className="font-medium text-gray-800">{quote.issueDate}</span>
                    </div>
                </div>
            </section>
            
            {/* Item Lists */}
            <section className="mb-8">
                <SectionHeader title="ITEM LISTS" />
                
                {/* Material Items */}
                {quote.items.some(item => !item.type || item.type === 'material') && (
                    <div className="mb-6">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Material Items</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-gray-500 border-b border-gray-200">
                                        <th className="pb-2 font-medium w-1/2">Description</th>
                                        <th className="pb-2 font-medium text-center">Qty</th>
                                        <th className="pb-2 font-medium text-right">Unit Price</th>
                                        <th className="pb-2 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quote.items.filter(item => !item.type || item.type === 'material').map(item => (
                                        <tr key={item.id} className="border-t border-gray-200">
                                            <td className="py-3 pr-2 font-medium text-gray-800">{item.description}</td>
                                            <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                                            <td className="py-3 text-right text-gray-600">{formatNaira(item.unitPrice)}</td>
                                            <td className="py-3 text-right font-semibold text-gray-800">{formatNaira(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Dimension Items */}
                {quote.items.some(item => item.type === 'dimension') && (
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dimension Items</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-gray-500 border-b border-gray-200">
                                        <th className="pb-2 font-medium w-1/3">Description</th>
                                        <th className="pb-2 font-medium text-center">Dimension</th>
                                        <th className="pb-2 font-medium text-center">Qty</th>
                                        <th className="pb-2 font-medium text-right">Price/m²</th>
                                        <th className="pb-2 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quote.items.filter(item => item.type === 'dimension').map(item => (
                                        <tr key={item.id} className="border-t border-gray-200">
                                            <td className="py-3 pr-2 font-medium text-gray-800">{item.description}</td>
                                            <td className="py-3 text-center text-gray-600 text-xs">
                                                {item.width}×{item.height}mm
                                                {item.panels && item.panels > 1 && (
                                                    <span className="text-gray-500 ml-1">({item.panels}P)</span>
                                                )}
                                            </td>
                                            <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                                            <td className="py-3 text-right text-gray-600">{formatNaira(item.unitPrice)}</td>
                                            <td className="py-3 text-right font-semibold text-gray-800">{formatNaira(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>

            {/* Summary */}
            <section className="mb-8">
                <SectionHeader title="SUMMARY" />
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-base">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-800">{formatNaira(quote.summary.subtotal)}</span>
                    </div>
                     {quote.summary.charges.map(charge => (
                        <div key={charge.label} className="flex justify-between items-center text-base">
                            <span className="text-gray-600">{charge.label}</span>
                            <span className="font-medium text-gray-800">{formatNaira(charge.amount)}</span>
                        </div>
                    ))}
                    <div className="border-t border-gray-200 my-3"></div>
                    <div className="flex justify-between items-center text-xl">
                        <span className="font-bold text-gray-900">Grand Total</span>
                        <span className="font-bold text-gray-900">{formatNaira(quote.summary.grandTotal)}</span>
                    </div>
                </div>
            </section>
            
            {/* Payment Information */}
            <section>
                <SectionHeader title="PAYMENT INFORMATION" />
                <div className="space-y-3 text-base">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Account Name:</span>
                        <span className="font-medium text-gray-800">{quote.paymentInfo.accountName}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-gray-600">Account Number:</span>
                        <span className="font-medium text-gray-800">{quote.paymentInfo.accountNumber}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-gray-600">Bank Name:</span>
                        <span className="font-medium text-gray-800">{quote.paymentInfo.bankName}</span>
                    </div>
                </div>
            </section>
        </div>
      </main>

      <footer className="bg-white p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => handleExportOption('pdf')}
            className="w-full py-4 bg-gray-800 text-white text-lg font-semibold rounded-lg hover:bg-gray-700 transition-colors"
          >
            Download as PDF
          </button>
        </div>
      </footer>

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 animate-slide-up">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Export Options</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => handleExportOption('pdf')}
                className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-colors text-left px-6 flex items-center gap-4"
              >
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
                <span>PDF Document</span>
              </button>

              <button
                onClick={() => handleExportOption('excel')}
                className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-colors text-left px-6 flex items-center gap-4"
              >
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L13 1.586A2 2 0 0011.586 1H9z" />
                </svg>
                <span>Excel Spreadsheet</span>
              </button>

              <button
                onClick={() => handleExportOption('share')}
                className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-colors text-left px-6 flex items-center gap-4"
              >
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Share / Copy</span>
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              className="w-full mt-6 py-3 text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotePreviewScreen;
