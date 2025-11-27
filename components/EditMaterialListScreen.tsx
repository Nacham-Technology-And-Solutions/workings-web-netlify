
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { FullMaterialList, MaterialListItem } from '../types';
import { ChevronLeftIcon, CalendarIcon, PlusIcon } from './icons/IconComponents';
import Input from './Input';
import CalendarModal from './CalendarModal';

interface EditMaterialListScreenProps {
  list: FullMaterialList;
  onBack: () => void;
  onNext: () => void;
}

const getDayWithSuffix = (day: number) => {
  if (day > 3 && day < 21) return day + 'th';
  switch (day % 10) {
    case 1: return day + "st";
    case 2: return day + "nd";
    case 3: return day + "rd";
    default: return day + "th";
  }
};

const formatDisplayDate = (date: Date | null): string => {
  if (!date) return '';
  const day = date.getUTCDate();
  const month = date.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  return `${getDayWithSuffix(day)} ${month}, ${year}`;
};

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

type EditableItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

const EditMaterialListScreen: React.FC<EditMaterialListScreenProps> = ({ list, onBack, onNext }) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Item List'>('Overview');
  const [projectName, setProjectName] = useState(list.projectName);
  const [issueDate, setIssueDate] = useState<Date | null>(new Date(list.date));
  const [preparedBy, setPreparedBy] = useState(list.preparedBy);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPreparedByDropdown, setShowPreparedByDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Initialize items from list
  const [items, setItems] = useState<EditableItem[]>(
    list.items.map((item, index) => ({
      id: item.id || `item-${index}`,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
    }))
  );

  // Sample artisans list
  const artisans = ['LEADS GLAZING', 'ARTISAN 1', 'ARTISAN 2', 'ARTISAN 3'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPreparedByDropdown(false);
      }
    };
    if (showPreparedByDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPreparedByDropdown]);

  const handleDateSelect = (date: Date) => {
    setIssueDate(date);
    setShowCalendar(false);
  };

  const handleItemChange = (index: number, field: keyof EditableItem, value: string) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, {
      id: `item-${Date.now()}`,
      description: '',
      quantity: '',
      unitPrice: '',
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate totals
  const itemTotals = useMemo(() => {
    return items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return qty * price;
    });
  }, [items]);

  const subtotal = useMemo(() => {
    return itemTotals.reduce((sum, total) => sum + total, 0);
  }, [itemTotals]);

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
      {/* Breadcrumbs Header */}
      <div className="px-6 lg:px-8 py-3 bg-white border-b border-gray-200">
        <div className="max-w-7xl lg:mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Material List</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Edit Material List</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl lg:mx-auto p-6 lg:p-8">
          {/* Page Title and Filter Button */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={onBack} 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeftIcon />
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Edit Material List</h1>
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium">Filter</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('Overview')}
                className={`pb-3 px-1 text-base font-semibold transition-colors relative ${
                  activeTab === 'Overview'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
                {activeTab === 'Overview' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('Item List')}
                className={`pb-3 px-1 text-base font-semibold transition-colors relative ${
                  activeTab === 'Item List'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Item List
                {activeTab === 'Item List' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
                )}
              </button>
            </div>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'Overview' && (
            <div className="space-y-6">
              {/* Project name */}
              <div>
                <Input
                  id="project-name"
                  label="Project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>

              {/* Issue Date */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={formatDisplayDate(issueDate)}
                    onClick={() => setShowCalendar(true)}
                    className="w-full px-4 py-3.5 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent cursor-pointer bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCalendar(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Open calendar"
                  >
                    <CalendarIcon />
                  </button>
                </div>
              </div>

              {/* Prepared by (Artisan's name) */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prepared by (Artisan's name)
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPreparedByDropdown(!showPreparedByDropdown)}
                    className="w-full px-4 py-3.5 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent bg-white text-left flex items-center justify-between"
                  >
                    <span className={preparedBy ? 'text-gray-900' : 'text-gray-400'}>
                      {preparedBy || 'Select artisan'}
                    </span>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform ${showPreparedByDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showPreparedByDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
                      {artisans.map((artisan) => (
                        <button
                          key={artisan}
                          type="button"
                          onClick={() => {
                            setPreparedBy(artisan);
                            setShowPreparedByDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                        >
                          {artisan}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Item List Tab Content */}
          {activeTab === 'Item List' && (
            <div className="space-y-6">
              {/* Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="col-span-1 text-xs font-semibold text-gray-700 uppercase">S/N</div>
                  <div className="col-span-4 text-xs font-semibold text-gray-700 uppercase">Description of Items</div>
                  <div className="col-span-2 text-xs font-semibold text-gray-700 uppercase text-center">Quantity</div>
                  <div className="col-span-2 text-xs font-semibold text-gray-700 uppercase text-right">Unit Price (₦)</div>
                  <div className="col-span-2 text-xs font-semibold text-gray-700 uppercase text-right">Total (₦)</div>
                  <div className="col-span-1 text-xs font-semibold text-gray-700 uppercase text-center">Action</div>
                </div>

                {/* Table Body */}
                <div>
                  {items.map((item, index) => {
                    const total = itemTotals[index];
                    return (
                      <div 
                        key={item.id}
                        className={`grid grid-cols-12 gap-4 px-4 py-3 items-center ${
                          index !== items.length - 1 ? 'border-b border-gray-200' : ''
                        }`}
                      >
                        {/* Serial Number */}
                        <div className="col-span-1 text-sm font-medium text-gray-900">
                          #{index + 1}
                        </div>

                        {/* Description */}
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Enter description"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent text-sm"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent text-sm text-center"
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={item.unitPrice ? formatNumber(parseFloat(item.unitPrice) || 0) : ''}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value.replace(/,/g, ''))}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent text-sm text-right"
                          />
                        </div>

                        {/* Total */}
                        <div className="col-span-2 text-sm font-semibold text-gray-900 text-right">
                          {formatNaira(total)}
                        </div>

                        {/* Action */}
                        <div className="col-span-1 flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Edit item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Delete item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add a Dimension Button */}
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              >
                <PlusIcon />
                <span className="text-sm font-medium">Add a Dimension</span>
              </button>

              {/* Subtotal */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-base font-semibold text-gray-900">Subtotal</span>
                <span className="text-base font-semibold text-gray-900">{formatNaira(subtotal)}</span>
              </div>
            </div>
          )}

          {/* Next Button - Only show in Overview tab, or at bottom of Item List */}
          {activeTab === 'Overview' ? (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setActiveTab('Item List')}
                className="w-full lg:w-auto px-8 py-3.5 bg-gray-800 text-white text-base font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          ) : (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={onNext}
                className="w-full lg:w-auto px-8 py-3.5 bg-gray-800 text-white text-base font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Calendar Modal */}
      {showCalendar && (
        <CalendarModal
          selectedDate={issueDate}
          onSelect={handleDateSelect}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
};

export default EditMaterialListScreen;

