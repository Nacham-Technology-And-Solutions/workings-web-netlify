import React from 'react';
import type { QuotePreviewData } from '../types';
import { ChevronLeftIcon, EditIcon, FolderIcon, LocationIcon } from './icons/IconComponents';

interface QuotePreviewScreenProps {
  quote: QuotePreviewData;
  onBack: () => void;
  onEdit: () => void;
}

const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount).replace('NGN', '₦');
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
        <div className="border-b-2 border-dashed border-gray-200 mb-4"></div>
    </div>
);

const QuotePreviewScreen: React.FC<QuotePreviewScreenProps> = ({ quote, onBack, onEdit }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-800">
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-gray-900" aria-label="Go back">
            <ChevronLeftIcon />
          </button>
          <h1 className="text-2xl font-bold">Quote Preview</h1>
        </div>
        <button onClick={onEdit} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900" aria-label="Edit quote">
          <EditIcon />
          <span>Edit</span>
        </button>
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
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-gray-500">
                                <th className="pb-2 font-medium w-1/2">Description</th>
                                <th className="pb-2 font-medium text-center">Qty</th>
                                <th className="pb-2 font-medium text-right">Unit Price</th>
                                <th className="pb-2 font-medium text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quote.items.map(item => (
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
            onClick={() => alert('Downloading PDF...')}
            className="w-full py-4 bg-gray-800 text-white text-lg font-semibold rounded-lg hover:bg-gray-700 transition-colors"
          >
            Download as PDF
          </button>
        </div>
      </footer>
    </div>
  );
};

export default QuotePreviewScreen;