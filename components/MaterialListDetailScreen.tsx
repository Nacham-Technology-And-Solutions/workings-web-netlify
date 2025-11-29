
import React, { useState, useRef, useEffect } from 'react';
import type { FullMaterialList } from '../types';
import { ChevronLeftIcon, MoreVerticalIcon } from './icons/IconComponents';

interface MaterialListDetailScreenProps {
  list: FullMaterialList;
  onBack: () => void;
  onEdit?: () => void;
}

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('NGN', '₦');
};

const formatNumber = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const MaterialListDetailScreen: React.FC<MaterialListDetailScreenProps> = ({ list, onBack, onEdit }) => {
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
  const day = date.getUTCDate();
  const month = date.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  const formattedDateWithSuffix = `${getDayWithSuffix(day)} ${month}, ${year}`;

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
      {/* Breadcrumbs Header */}
      <div className="px-6 lg:px-8 py-3 bg-white border-b border-gray-200">
        <div className="max-w-7xl lg:mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Material List</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Material List Details</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl lg:mx-auto p-6 lg:p-8">
          {/* Page Title and Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={onBack} 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeftIcon />
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Material List</h1>
            </button>
            
            <div className="flex items-center gap-3">
              {/* Edit Button */}
              <button 
                onClick={onEdit}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" 
                aria-label="Edit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              {/* Download PDF Button */}
              <button className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                Download PDF
              </button>
              
              {/* More Options */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(prev => !prev)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" 
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
                          Share
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                          Duplicate
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
            </div>
          </div>

          {/* Material List Details Card */}
          <div className="bg-gray-100 rounded-lg p-6 mb-6">
            <div className="space-y-4">
              {/* Issue Date with Status */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-600">Issue Date: </span>
            <span className="font-medium text-gray-900">{formattedDateWithSuffix}</span>
          </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
              {list.status}
            </span>
          </div>
              
              {/* Prepared by */}
              <div>
                <span className="text-gray-600">Prepared by: </span>
                <span className="font-medium text-gray-900">{list.preparedBy}</span>
        </div>

              {/* Project */}
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-gray-600">Project: </span>
                <span className="font-medium text-gray-900">{list.projectName}</span>
        </div>
            </div>
          </div>

          {/* Item Lists Card */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">ITEM LISTS</h3>
            
            {/* Table */}
            <div className="bg-white rounded-lg overflow-hidden">
            {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="col-span-5 text-sm font-semibold text-gray-700">Description</div>
                <div className="col-span-2 text-sm font-semibold text-gray-700 text-center">Qty</div>
                <div className="col-span-2 text-sm font-semibold text-gray-700 text-right">Unit Price (N)</div>
                <div className="col-span-3 text-sm font-semibold text-gray-700 text-right">Total (N)</div>
            </div>

            {/* Table Body */}
              <div>
                {list.items.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`grid grid-cols-12 gap-4 px-4 py-3 ${
                      index !== list.items.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    <div className="col-span-5 text-base text-gray-900 font-medium">
                            {item.description}
                        </div>
                        <div className="col-span-2 text-base text-gray-600 text-center">
                            {item.quantity}
                        </div>
                    <div className="col-span-2 text-base text-gray-600 text-right">
                      {formatNumber(item.unitPrice)}
                        </div>
                    <div className="col-span-3 text-base font-semibold text-gray-900 text-right">
                      {formatNumber(item.total)}
                        </div>
                    </div>
                ))}
            </div>

              {/* Total Row */}
              <div className="px-4 py-4 bg-gray-50 border-t-2 border-gray-300 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">{formatNaira(list.total)}</span>
              </div>
            </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default MaterialListDetailScreen;