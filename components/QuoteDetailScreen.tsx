
import React from 'react';
import type { FullQuoteData } from '../types';
import { ChevronLeftIcon, MoreVerticalIcon } from './icons/IconComponents';

interface QuoteDetailScreenProps {
  quote: FullQuoteData;
  onBack: () => void;
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
    <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
        <div className="border-b-2 border-dashed border-gray-200 mb-4"></div>
    </div>
);


const QuoteDetailScreen: React.FC<QuoteDetailScreenProps> = ({ quote, onBack }) => {

  const getDayWithSuffix = (day: number) => {
    if (day > 3 && day < 21) return day + 'th';
    switch (day % 10) {
      case 1:  return day + "st";
      case 2:  return day + "nd";
      case 3:  return day + "rd";
      default: return day + "th";
    }
  };

  const date = new Date(quote.issueDate);
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  const formattedDateWithSuffix = `${getDayWithSuffix(day)} ${month}, ${year}`;


  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-800">
      <header className="bg-white p-4 flex justify-between items-center sticky top-0 z-40 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-gray-900" aria-label="Go back">
            <ChevronLeftIcon />
          </button>
          <h1 className="text-2xl font-bold">Quotes</h1>
        </div>
        <button className="p-2 -mr-2 text-gray-600 hover:text-gray-900" aria-label="More options">
            <MoreVerticalIcon />
        </button>
      </header>
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">
            <div className="space-y-3">
                <div className="flex">
                    <span className="w-2/5 text-gray-600 text-sm">Project Name:</span>
                    <span className="w-3/5 font-medium text-gray-800 text-sm">{quote.projectName}</span>
                </div>
                <div className="flex">
                    <span className="w-2/5 text-gray-600 text-sm">Location:</span>
                    <span className="w-3/5 font-medium text-gray-800 text-sm">{quote.location}</span>
                </div>
                <div className="flex items-center">
                    <span className="w-2/5 text-gray-600 text-sm">Status:</span>
                    <div className="w-3/5">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {quote.projectStatus}
                        </span>
                    </div>
                </div>
            </div>
            <div className="border-b-2 border-dashed border-gray-200 my-4"></div>
            <div className="grid grid-cols-2 gap-x-4">
                <div className="flex flex-col">
                    <span className="text-gray-600 text-sm">Quote ID:</span>
                    <span className="font-medium text-gray-800 text-sm">{quote.quoteId}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-600 text-sm">Issue Date:</span>
                    <span className="font-medium text-gray-800 text-sm">{formattedDateWithSuffix}</span>
                </div>
            </div>
        </div>

        <section>
          <SectionHeader title="CUSTOMERS' INFORMATION" />
          <div className="space-y-3 text-sm">
             <div className="flex justify-between items-center">
                <span className="text-gray-600">Customer's name:</span>
                <span className="font-medium text-gray-800">{quote.customerName}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-gray-600">Customer's Email address:</span>
                <span className="font-medium text-gray-800">{quote.customerEmail}</span>
             </div>
          </div>
        </section>
        
        <section>
          <SectionHeader title="ITEM LISTS" />
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead>
                      <tr className="text-gray-500">
                          <th className="pb-2 font-medium w-2/5">Description</th>
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
        
        <section className="pb-8">
          <SectionHeader title="SUMMARY" />
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-800">{formatNaira(quote.summary.subtotal)}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default QuoteDetailScreen;
