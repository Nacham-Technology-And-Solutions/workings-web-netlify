
import React, { useState, useMemo, useEffect } from 'react';
import { formatNaira } from '@/utils/formatters';
import type { MaterialListItem, FullMaterialList } from '@/types';
import {
  ChevronLeftIcon,
  TrashIcon,
  FilterIcon,
} from '@/assets/icons/IconComponents';
import CalendarModal from '@/components/common/CalendarModal';
import { useMaterialListStore } from '@/stores';

interface CreateMaterialListScreenProps {
  onBack: () => void;
  onPreview: (data: FullMaterialList) => void;
  onSaveDraft: (data: FullMaterialList) => void;
}

type EditableMaterialItem = Omit<MaterialListItem, 'total' | 'quantity' | 'unitPrice'> & {
  quantity: string;
  unitPrice: string;
};

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

const CreateMaterialListScreen: React.FC<CreateMaterialListScreenProps> = ({ onBack, onPreview, onSaveDraft }) => {
  const { duplicateMaterialListData, setDuplicateMaterialListData } = useMaterialListStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'itemList'>('overview');
  const [projectName, setProjectName] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [preparedBy, setPreparedBy] = useState('');
  const [items, setItems] = useState<EditableMaterialItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{ description: string; quantity: string; unitPrice: string } | null>(null);

  const [showCalendar, setShowCalendar] = useState(false);

  // Initialize from duplicate data when present
  useEffect(() => {
    if (duplicateMaterialListData) {
      setProjectName(duplicateMaterialListData.projectName);
      setDate(duplicateMaterialListData.date ? new Date(duplicateMaterialListData.date) : null);
      setPreparedBy(duplicateMaterialListData.preparedBy);
      setItems(duplicateMaterialListData.items.map((item, i) => ({
        id: item.id || `item-${i + 1}`,
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
      })));
      setDuplicateMaterialListData(null);
    }
  }, [duplicateMaterialListData, setDuplicateMaterialListData]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity);
      const price = parseFloat(item.unitPrice);
      if (!isNaN(qty) && !isNaN(price)) {
        return sum + qty * price;
      }
      return sum;
    }, 0);
  }, [items]);

  const canProceed = useMemo(() => {
    return items.length > 0 && items.every((item) => {
      const qty = parseFloat(item.quantity);
      const price = parseFloat(item.unitPrice);
      return !isNaN(qty) && !isNaN(price) && qty > 0 && price > 0 && item.description.trim() !== '';
    });
  }, [items]);

  const handleDateSelect = (selectedDate: Date) => {
    setDate(selectedDate);
    setShowCalendar(false);
  };

  const handleDateClear = () => {
    setDate(null);
    setShowCalendar(false);
  };

  const handleItemChange = (index: number, field: keyof EditableMaterialItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddItem = () => {
    const newId = `item-${Date.now()}`;
    setItems([...items, { id: newId, description: '', quantity: '1', unitPrice: '' }]);
    setEditingItemId(newId);
    setEditFormData({ description: '', quantity: '1', unitPrice: '' });
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
      setEditFormData(null);
    }
  };

  const handleEditItem = (item: EditableMaterialItem) => {
    setEditingItemId(item.id);
    setEditFormData({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });
  };

  const handleSaveEdit = () => {
    if (editingItemId && editFormData) {
      setItems(items.map((item) =>
        item.id === editingItemId
          ? { ...item, description: editFormData!.description, quantity: editFormData!.quantity, unitPrice: editFormData!.unitPrice }
          : item
      ));
      setEditingItemId(null);
      setEditFormData(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditFormData(null);
  };

  const handleEditFormChange = (field: 'description' | 'quantity' | 'unitPrice', value: string | number) => {
    if (editFormData) {
      setEditFormData({ ...editFormData, [field]: String(value) });
    }
  };

  const handleProceedToPreview = () => {
    const previewData: FullMaterialList = {
      id: `mlist-prev-${Date.now()}`,
      projectName,
      date: date ? date.toISOString() : new Date().toISOString(),
      preparedBy,
      status: 'Draft',
      items: items.map((item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        return {
          id: item.id,
          description: item.description,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        };
      }),
      total,
    };
    onPreview(previewData);
  };

  const handleSaveAsDraft = () => {
    const draftData: FullMaterialList = {
      id: `mlist-draft-${Date.now()}`,
      projectName,
      date: date ? date.toISOString() : new Date().toISOString(),
      preparedBy,
      status: 'Draft',
      items: items.map((item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        return {
          id: item.id,
          description: item.description,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        };
      }),
      total,
    };
    onSaveDraft(draftData);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white font-sans text-gray-800">
      {/* Header / Breadcrumbs - Quote style */}
      <div className="px-4 lg:px-8 py-4 lg:py-6 border-b border-gray-100 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="hidden md:block">
          <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-400 mb-4 lg:mb-6">
            <span className="cursor-pointer hover:text-gray-600" onClick={onBack}>Material List</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-gray-600">Create Material List</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">{activeTab === 'overview' ? 'Overview' : 'Item List'}</span>
          </div>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <button onClick={onBack} className="text-gray-600 hover:text-gray-900 mt-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                  Create Material List
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-h-0 px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="mb-8 border-b border-gray-200">
            <div className="flex items-center gap-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-4 px-0 text-sm font-medium transition-colors relative ${activeTab === 'overview'
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Overview
                {activeTab === 'overview' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('itemList')}
                className={`pb-4 px-0 text-sm font-medium transition-colors relative ${activeTab === 'itemList'
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Material List
                {activeTab === 'itemList' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                )}
              </button>
            </div>
          </div>

          {/* Overview Tab Content - 2-column grid like Quote */}
          {activeTab === 'overview' && (
            <div className="max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Enter project name"
                  />
                </div>

                {/* Issued Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issued Date</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatDisplayDate(date)}
                      readOnly
                      onClick={() => setShowCalendar(true)}
                      placeholder="Select date"
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer"
                    />
                    <button
                      onClick={() => setShowCalendar(true)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <CalendarModal
                    isOpen={showCalendar}
                    onClose={() => setShowCalendar(false)}
                    onSubmit={handleDateSelect}
                    onClear={handleDateClear}
                    initialDate={date}
                  />
                </div>

                {/* Prepared by (Artisan's name) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prepared by (Artisan&apos;s name)</label>
                  <input
                    type="text"
                    value={preparedBy}
                    onChange={(e) => setPreparedBy(e.target.value)}
                    placeholder="Enter artisan's name"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Material List Tab Content - Table like image 3 */}
          {activeTab === 'itemList' && (
            <>
              <div className="flex justify-end mb-4">
                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  <FilterIcon className="w-4 h-4" />
                  <span className="font-medium">Filter</span>
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S/N</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description of Items</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price (₦)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (₦)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => {
                      const isEditing = editingItemId === item.id;
                      const qty = parseFloat(item.quantity) || 0;
                      const price = parseFloat(item.unitPrice) || 0;
                      const itemTotal = isEditing && editFormData
                        ? (parseFloat(editFormData.quantity) || 0) * (parseFloat(editFormData.unitPrice) || 0)
                        : qty * price;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-gray-900">#{index + 1}</td>
                          <td className="px-4 py-4 text-sm">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.description}
                                onChange={(e) => handleEditFormChange('description', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                                autoFocus
                              />
                            ) : (
                              <span className="text-gray-900">{item.description || '—'}</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.quantity}
                                onChange={(e) => handleEditFormChange('quantity', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                              />
                            ) : (
                              <span className="text-gray-900">{item.quantity}</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.unitPrice}
                                onChange={(e) => handleEditFormChange('unitPrice', e.target.value.replace(/,/g, ''))}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                              />
                            ) : (
                              <span className="text-gray-900">{item.unitPrice ? parseFloat(item.unitPrice).toLocaleString() : '—'}</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {formatNaira(itemTotal)}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={handleSaveEdit}
                                    className="text-green-600 hover:text-green-800"
                                    title="Save"
                                  >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-gray-600 hover:text-gray-800"
                                    title="Cancel"
                                  >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditItem(item)}
                                    className="text-gray-600 hover:text-blue-600"
                                    title="Edit"
                                  >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-gray-600 hover:text-red-600"
                                    title="Delete"
                                  >
                                    <TrashIcon className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleAddItem}
                className="w-full py-3 mb-8 border-2 border-dashed border-teal-400 text-teal-600 rounded hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Add an Item</span>
              </button>

              <div className="flex justify-between items-center py-4 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Subtotal</span>
                <span className="text-2xl font-bold text-gray-900">{formatNaira(total)}</span>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer - Proceed to preview & Save as Draft */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-3">
          <button
            type="button"
            onClick={handleProceedToPreview}
            disabled={!canProceed}
            className={`w-full py-3.5 font-semibold rounded-lg transition-colors ${
              canProceed
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Proceed to preview
          </button>
          <button
            type="button"
            onClick={handleSaveAsDraft}
            disabled={!canProceed}
            className={`w-full py-3.5 font-semibold rounded-lg border transition-colors ${
              canProceed
                ? 'bg-white text-gray-800 border-gray-400 hover:bg-gray-100'
                : 'bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed'
            }`}
          >
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMaterialListScreen;
