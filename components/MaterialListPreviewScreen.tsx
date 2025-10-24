
import React from 'react';
import type { FullMaterialList } from '../types';
import { ChevronLeftIcon } from './icons/IconComponents';

interface MaterialListPreviewScreenProps {
  list: FullMaterialList;
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

const MaterialListPreviewScreen: React.FC<MaterialListPreviewScreenProps> = ({ list, onBack }) => {
  const getDayWithSuffix = (day: number) => {
    if (day > 3 && day < 21) return day + 'th';
    switch (day % 10) {
      case 1: return day + "st";
      case 2: return day + "nd";
      case 3: return day + "rd";
      default: return day + "th";
    }
  };

  const date = new Date(list.date);
  const day = date.getUTCDate(); // Use UTC to avoid timezone issues
  const month = date.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  const formattedDate = `${getDayWithSuffix(day)} ${month}, ${year}`;

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
      <header className="p-4 flex items-center gap-4 sticky top-0 z-40 bg-white border-b border-gray-200">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900" aria-label="Go back">
          <ChevronLeftIcon />
        </button>
        <h1 className="text-2xl font-bold truncate">{list.projectName}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-28">
        <div className="space-y-4 text-sm mb-8">
          <div className="flex">
            <span className="w-1/3 text-gray-600">Project Name:</span>
            <span className="w-2/3 font-medium text-gray-900">{list.projectName}</span>
          </div>
          <div className="flex">
            <span className="w-1/3 text-gray-600">Date:</span>
            <span className="w-2/3 font-medium text-gray-900">{formattedDate}</span>
          </div>
          <div className="flex">
            <span className="w-1/3 text-gray-600">Prepared by:</span>
            <span className="w-2/3 font-medium text-gray-900">{list.preparedBy}</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">ITEM LISTS</h3>
          <div className="border-b-2 border-dashed border-gray-300 mb-4"></div>
        </div>

        {/* Item Table */}
        <div className="w-full">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-x-4 text-sm font-medium text-gray-500 pb-2 border-b border-gray-300">
                <div className="col-span-4">Description</div>
                <div className="col-span-2 text-left">Qty</div>
                <div className="col-span-3 text-left">Unit Price(₦)</div>
                <div className="col-span-3 text-left">Total(₦)</div>
            </div>

            {/* Table Body */}
            <div className="mt-1">
                {list.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-x-4 items-start py-3 border-b border-gray-200 text-sm">
                        <div className="col-span-4 text-gray-800 font-medium break-words">
                            {item.description}
                        </div>
                        <div className="col-span-2 text-gray-600 text-left">
                            {item.quantity}
                        </div>
                        <div className="col-span-3 text-gray-600 text-left">
                            {item.unitPrice.toLocaleString('en-US')}
                        </div>
                        <div className="col-span-3 font-semibold text-gray-800 text-left">
                           {item.total.toLocaleString('en-US')}
                        </div>
                    </div>
                ))}
            </div>

             <div className="mt-6 pt-4 border-t-2 border-gray-300 flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">{formatNaira(list.total)}</span>
            </div>
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

export default MaterialListPreviewScreen;
