import React from 'react';
import { formatNaira } from '@/utils/formatters';
import type { QuotePreviewData } from '@/types';
import { ChevronLeftIcon, EditIcon, FolderIcon, LocationIcon } from '@/assets/icons/IconComponents';
import { exportQuoteToPDF } from '@/services/export/exportService';

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
  const handleDownloadPDF = () => {
    exportQuoteToPDF(
      quote.quoteId,
      quote.issueDate,
      quote.customerName,
      quote.projectName,
      quote.siteAddress,
      quote.items,
      quote.summary,
      quote.paymentInfo
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-800">
      {/* Breadcrumbs */}
      <div className="px-8 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="cursor-pointer hover:text-gray-600">Projects</span>
          <span>/</span>
          <span className="cursor-pointer hover:text-gray-600">Glazing-Type</span>
          <span>/</span>
          <span className="cursor-pointer hover:text-gray-600">Create New Quote</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Quote Preview</span>
        </div>
      </div>

      {/* Header with Title and Actions */}
      <header className="px-8 py-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-600 hover:text-gray-900" aria-label="Go back">
              <ChevronLeftIcon />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Quote Preview</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <EditIcon className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 text-sm font-semibold text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Download PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Quote Information Card */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600">Quote ID: </span>
                    <span className="text-sm font-medium text-gray-800">{quote.quoteId}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Issue Date: </span>
                    <span className="text-sm font-medium text-gray-800">{quote.issueDate}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Billed to: </span>
                    <span className="text-sm font-bold text-gray-800">{quote.customerName}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <FolderIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-gray-600">Project: </span>
                      <span className="text-sm font-bold text-gray-800">{quote.projectName}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <LocationIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-gray-600">Location: </span>
                      <span className="text-sm font-bold text-gray-800">{quote.siteAddress}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Lists Card */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <SectionHeader title="ITEM LISTS" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {quote.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNaira(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-800">{formatNaira(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <SectionHeader title="SUMMARY" />
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-base">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-800 text-right">{formatNaira(quote.summary.subtotal)}</span>
                  </div>
                  {quote.summary.charges.map((charge) => (
                    <div key={charge.label} className="flex justify-between items-center text-base">
                      <span className="text-gray-600">{charge.label}</span>
                      <span className="font-medium text-gray-800 text-right">{formatNaira(charge.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 my-3"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Grand Total</span>
                    <span className="text-xl font-bold text-gray-900 text-right">{formatNaira(quote.summary.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information Card */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <SectionHeader title="PAYMENT INFORMATION" />
                <div className="space-y-3 text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account Name:</span>
                    <span className="font-bold text-gray-800 text-right">{quote.paymentInfo.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account Number:</span>
                    <span className="font-bold text-gray-800 text-right">{quote.paymentInfo.accountNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bank Name:</span>
                    <span className="font-bold text-gray-800 text-right">{quote.paymentInfo.bankName}</span>
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

export default QuotePreviewScreen;
