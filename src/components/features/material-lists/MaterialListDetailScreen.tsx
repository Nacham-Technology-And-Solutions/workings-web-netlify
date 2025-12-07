
import React, { useState, useRef, useEffect } from 'react';
import { formatNaira } from '@/utils/formatters';
import type { FullMaterialList } from '@/types';
import { ChevronLeftIcon, MoreVerticalIcon } from '@/assets/icons/IconComponents';

interface MaterialListDetailScreenProps {
  list: FullMaterialList;
  onBack: () => void;
  onEdit?: () => void;
}


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

  const isDraft = list.status === 'Draft';
  const isCompleted = list.status === 'Completed';

  return (
    <div className="flex flex-col h-full bg-white font-sans text-gray-800">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Material List</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Material List Details</span>
          </div>

          {/* Page Title and Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button 
                onClick={onBack} 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Go back"
              >
                <ChevronLeftIcon />
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Material List</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Edit Button - Always visible, but more prominent for drafts */}
              {onEdit && (
                <button 
                  onClick={onEdit}
                  className={`px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                    isDraft ? 'border-gray-400' : ''
                  }`}
                  aria-label="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}
              
              {/* Download PDF Button - Only show for completed */}
              {isCompleted && (
                <button className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                  Download PDF
                </button>
              )}
              
              {/* More Options */}
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsMenuOpen(prev => !prev)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" 
                  aria-label="More options"
                  aria-haspopup="true"
                  aria-expanded={isMenuOpen}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
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

          {/* Material List Details Card - Single Large Card */}
          <div className={`rounded-2xl p-6 lg:p-8 max-w-2xl shadow-sm ${
            isCompleted ? 'bg-gray-100' : 'bg-white'
          }`}>
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-gray-600">Issue Date: </span>
                <span className="font-medium text-gray-900">{formattedDateWithSuffix}</span>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                isCompleted
                  ? 'bg-green-500 text-white' 
                  : isDraft
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {list.status}
              </span>
            </div>
              
            {/* Details Section */}
            <div className="space-y-3 mb-6">
              <div>
                <span className="text-gray-600">Prepared by: </span>
                <span className="font-bold text-gray-900">{list.preparedBy}</span>
              </div>

              <div>
                <span className="text-gray-600">Project: </span>
                <span className="font-medium text-gray-900">{list.projectName}</span>
              </div>
            </div>

            {/* Table Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ITEM LISTS</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="col-span-5 text-sm font-semibold text-gray-700">Description</div>
                  <div className="col-span-2 text-sm font-semibold text-gray-700 text-center">Qty</div>
                  <div className="col-span-2 text-sm font-semibold text-gray-700 text-right">Unit Price (₦)</div>
                  <div className="col-span-3 text-sm font-semibold text-gray-700 text-right">Total (₦)</div>
                </div>

                {/* Table Body */}
                <div className="bg-white">
                  {list.items.map((item, index) => (
                    <div 
                      key={item.id} 
                      className={`grid grid-cols-12 gap-4 px-4 py-3 bg-white ${
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

                {/* Total Row - Different layout for Draft vs Completed */}
                {isCompleted ? (
                  <div className="px-4 py-4 bg-gray-50 border-t-2 border-gray-300 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">{formatNaira(list.total)}</span>
                  </div>
                ) : (
                  <div className="px-4 py-4 bg-gray-50 border-t-2 border-gray-300 flex justify-end items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">{formatNaira(list.total)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MaterialListDetailScreen;
