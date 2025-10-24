
import React, { useState, useRef, useEffect } from 'react';
import type { FullMaterialList } from '../types';
import { ChevronLeftIcon, MoreVerticalIcon } from './icons/IconComponents';

interface MaterialListDetailScreenProps {
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

const MaterialListDetailScreen: React.FC<MaterialListDetailScreenProps> = ({ list, onBack }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


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
  const formattedDateWithSuffix = `${getDayWithSuffix(day)} ${month}, ${year}`;

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
      <header className="p-4 flex justify-between items-center sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-900" aria-label="Go back">
            <ChevronLeftIcon />
          </button>
          <h1 className="text-2xl font-bold">Material List</h1>
        </div>
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="text-gray-600 hover:text-gray-900 p-2 -mr-2 rounded-full hover:bg-gray-100" 
            aria-label="More options"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
          >
            <MoreVerticalIcon />
          </button>
          {isMenuOpen && (
            <div 
              className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
              role="menu"
            >
              <ul className="py-1">
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                    Download - PDF
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                    Preview
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" role="menuitem">
                    Delete
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Project Name:</span>
            <span className="font-medium text-gray-900 text-right">{list.projectName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium text-gray-900">{formattedDateWithSuffix}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Prepared by:</span>
            <span className="font-medium text-gray-900">{list.preparedBy}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600">Status:</span>
            <span className="ml-auto px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              {list.status}
            </span>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">ITEM LISTS</h3>
          <div className="border-b-2 border-dashed border-gray-300 mb-4"></div>
        </div>

        {/* Item Table */}
        <div className="w-full">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-x-4 text-sm font-medium text-gray-500 pb-2 border-b border-gray-300">
                <div className="col-span-4">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-3 text-right">Unit Price</div>
                <div className="col-span-3 text-right">Total</div>
            </div>

            {/* Table Body */}
            <div className="mt-1">
                {list.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-x-4 items-center py-3 border-b border-gray-200">
                        <div className="col-span-4 text-base text-gray-800 font-medium break-words">
                            {item.description}
                        </div>
                        <div className="col-span-2 text-base text-gray-600 text-center">
                            {item.quantity}
                        </div>
                        <div className="col-span-3 text-base text-gray-600 text-right">
                            {formatNaira(item.unitPrice)}
                        </div>
                        <div className="col-span-3 text-base font-semibold text-gray-800 text-right">
                           {formatNaira(item.total)}
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
    </div>
  );
};

export default MaterialListDetailScreen;