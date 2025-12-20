import React, { useState } from 'react';
import type { QuoteItemListData, QuoteItemRow } from '@/types';

interface QuoteItemListScreenProps {
    onBack: () => void;
    onNext: (data: QuoteItemListData) => void;
    previousData?: any;
    quoteType?: 'standalone' | 'from_project';
    materialCost?: number;
}

const QuoteItemListScreen: React.FC<QuoteItemListScreenProps> = ({ onBack, onNext, previousData, quoteType = 'standalone', materialCost }) => {
    // Initialize items: use previous data if available, otherwise use defaults or material cost for project quotes
    const getInitialItems = (): QuoteItemRow[] => {
        if (previousData?.itemList?.items && previousData.itemList.items.length > 0) {
            return previousData.itemList.items;
        }
        
        // For project quotes, initialize with material cost as a single item
        if (quoteType === 'from_project' && materialCost !== undefined && materialCost > 0) {
            return [
                {
                    id: '1',
                    description: 'Material Cost',
                    quantity: 1,
                    unitPrice: materialCost,
                    total: materialCost
                }
            ];
        }
        
        // Default items for standalone quotes
        return [
            { id: '1', description: '1200 x 1200', quantity: 10, unitPrice: 10000, total: 100000 },
            { id: '2', description: '600 x 700', quantity: 4, unitPrice: 10000, total: 40000 },
        ];
    };

    const initialItems = getInitialItems();
    const [listType, setListType] = useState<'dimension' | 'material'>(
        previousData?.itemList?.listType || 'dimension'
    );
    const [items, setItems] = useState<QuoteItemRow[]>(initialItems);
    const [showWarning, setShowWarning] = useState(!initialItems || initialItems.length === 0);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<QuoteItemRow | null>(null);

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + item.total, 0);
    };

    const handleAddDimension = () => {
        const newItem: QuoteItemRow = {
            id: String(items.length + 1),
            description: '',
            quantity: 0,
            unitPrice: 0,
            total: 0
        };
        setItems([...items, newItem]);
        setEditingItemId(newItem.id);
        setEditFormData({ ...newItem });
    };

    const handleDeleteItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
        if (editingItemId === id) {
            setEditingItemId(null);
            setEditFormData(null);
        }
    };

    const handleEditItem = (item: QuoteItemRow) => {
        setEditingItemId(item.id);
        setEditFormData({ ...item });
    };

    const handleSaveEdit = () => {
        if (!editingItemId || !editFormData) return;
        
        const updatedItems = items.map(item => {
            if (item.id === editingItemId) {
                const updated = {
                    ...editFormData,
                    total: editFormData.quantity * editFormData.unitPrice
                };
                return updated;
            }
            return item;
        });
        
        setItems(updatedItems);
        setEditingItemId(null);
        setEditFormData(null);
    };

    const handleCancelEdit = () => {
        setEditingItemId(null);
        setEditFormData(null);
    };

    const handleEditFormChange = (field: keyof QuoteItemRow, value: string | number) => {
        if (!editFormData) return;
        setEditFormData({
            ...editFormData,
            [field]: value
        });
    };

    const handleNext = () => {
        const data: QuoteItemListData = {
            listType,
            items,
            subtotal: calculateSubtotal()
        };
        onNext(data);
    };

    return (
        <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
            {/* Header / Breadcrumbs */}
            <div className="px-8 py-6 border-b border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                        <span className="cursor-pointer hover:text-gray-600">Projects</span>
                        <span>/</span>
                        <span className="cursor-pointer hover:text-gray-600">Glazing-Type</span>
                        <span>/</span>
                        <span className="cursor-pointer hover:text-gray-600">Create New Quote</span>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Item List</span>
                    </div>

                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <button onClick={onBack} className="text-gray-600 hover:text-gray-900 mt-1">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">Create New Quote</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning Message */}
            {showWarning && (
                <div className="px-8 py-4 bg-yellow-50 border-b border-yellow-100">
                    <div className="max-w-7xl mx-auto flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-yellow-800">List Selection Required!</p>
                                <p className="text-sm text-yellow-700">Please select a Dimension or Material List to proceed with your quote.</p>
                            </div>
                        </div>
                        <button onClick={() => setShowWarning(false)} className="text-yellow-600 hover:text-yellow-800">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Tabs */}
                    <div className="mb-8 border-b border-gray-200">
                        <div className="flex items-center gap-8">
                            <button
                                onClick={onBack}
                                className="pb-4 px-0 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors relative"
                            >
                                Overview
                            </button>
                            <button
                                className="pb-4 px-0 text-sm font-medium text-gray-900 transition-colors relative"
                            >
                                Item List
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                            </button>
                            <button
                                className="pb-4 px-0 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors relative"
                            >
                                Extras & Notes
                            </button>

                            {/* Filter Button */}
                            <button className="ml-auto pb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
                                <span className="text-sm">Filter</span>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* List Type Selection - Only show for from_project quotes */}
                    {quoteType === 'from_project' && (
                        <div className="mb-6">
                            <p className="text-sm text-gray-700 mb-3">Select a list to pull items into your quote:</p>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="listType"
                                        value="dimension"
                                        checked={listType === 'dimension'}
                                        onChange={() => setListType('dimension')}
                                        className="w-4 h-4 text-gray-900 focus:ring-gray-900"
                                    />
                                    <span className="text-sm text-gray-900">Dimension List</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="listType"
                                        value="material"
                                        checked={listType === 'material'}
                                        onChange={() => setListType('material')}
                                        className="w-4 h-4 text-gray-900 focus:ring-gray-900"
                                    />
                                    <span className="text-sm text-gray-900">Material List</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
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
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 text-sm text-gray-900">#{item.id}</td>
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
                                                    <span className="text-gray-900">{item.description}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                {isEditing && editFormData ? (
                                                    <input
                                                        type="number"
                                                        value={editFormData.quantity}
                                                        onChange={(e) => handleEditFormChange('quantity', parseInt(e.target.value) || 0)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                    />
                                                ) : (
                                                    <span className="text-gray-900">{item.quantity}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                {isEditing && editFormData ? (
                                                    <input
                                                        type="number"
                                                        value={editFormData.unitPrice}
                                                        onChange={(e) => handleEditFormChange('unitPrice', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                    />
                                                ) : (
                                                    <span className="text-gray-900">{item.unitPrice.toLocaleString()}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                                ₦ {isEditing && editFormData 
                                                    ? (editFormData.quantity * editFormData.unitPrice).toLocaleString()
                                                    : item.total.toLocaleString()}
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
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
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

                    {/* Add Dimension Button */}
                    <button
                        onClick={handleAddDimension}
                        className="w-full py-3 mb-8 border-2 border-dashed border-teal-400 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Add a Dimension</span>
                    </button>

                    {/* Subtotal */}
                    <div className="flex justify-between items-center py-4 border-t border-gray-200">
                        <span className="text-lg font-semibold text-gray-900">Subtotal</span>
                        <span className="text-2xl font-bold text-gray-900">₦{calculateSubtotal().toLocaleString()}</span>
                    </div>
                </div>
            </main>

            {/* Footer with Next Button */}
            <div className="border-t border-gray-200 bg-white px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={handleNext}
                        className="w-full py-4 font-semibold rounded-lg transition-colors bg-gray-900 text-white hover:bg-gray-800"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuoteItemListScreen;
