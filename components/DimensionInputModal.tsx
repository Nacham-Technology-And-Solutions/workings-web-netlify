import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/IconComponents';
import type { QuoteItem } from '../types';

interface DimensionInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (dimension: Omit<QuoteItem, 'total' | 'id'>) => void;
  editingItem?: Omit<QuoteItem, 'total'> | null;
}

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('NGN', '₦');
};

const DimensionInputModal: React.FC<DimensionInputModalProps> = ({ isOpen, onClose, onAdd, editingItem }) => {
  const [description, setDescription] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [panels, setPanels] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');

  useEffect(() => {
    if (isOpen && editingItem) {
      setDescription(editingItem.description);
      setWidth(editingItem.width?.toString() || '');
      setHeight(editingItem.height?.toString() || '');
      setQuantity(editingItem.quantity.toString());
      setPanels(editingItem.panels?.toString() || '1');
      setUnitPrice(editingItem.unitPrice.toString());
    } else if (isOpen && !editingItem) {
      // Reset form for new item
      setDescription('');
      setWidth('');
      setHeight('');
      setQuantity('1');
      setPanels('1');
      setUnitPrice('');
    }
  }, [isOpen, editingItem]);

  const calculatedTotal = () => {
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    
    // Calculate area (width * height) * quantity * unit price
    return w * h * qty * price;
  };

  const handleAdd = () => {
    if (!description || !width || !height || !quantity || !unitPrice) {
      alert('Please fill in all required fields');
      return;
    }

    const dimensionData: Omit<QuoteItem, 'total' | 'id'> = {
      description,
      width: parseFloat(width),
      height: parseFloat(height),
      quantity: parseFloat(quantity),
      panels: parseFloat(panels) || 1,
      unitPrice: parseFloat(unitPrice),
      type: 'dimension'
    };

    onAdd(dimensionData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true"></div>
      
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg mx-auto transform transition-transform duration-300 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 pb-4 border-b border-gray-200 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingItem ? 'Edit Dimension' : 'Add Dimension'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
          <p className="text-gray-500 mt-2">Enter the dimensions and pricing details</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Description */}
          <div>
            <label htmlFor="dimension-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              id="dimension-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Casement Window"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          {/* Width and Height */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dimension-width" className="block text-sm font-medium text-gray-700 mb-2">
                Width (mm) <span className="text-red-500">*</span>
              </label>
              <input
                id="dimension-width"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="1200"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div>
              <label htmlFor="dimension-height" className="block text-sm font-medium text-gray-700 mb-2">
                Height (mm) <span className="text-red-500">*</span>
              </label>
              <input
                id="dimension-height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="1200"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          </div>

          {/* Quantity and Panels */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dimension-quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                id="dimension-quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                min="1"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div>
              <label htmlFor="dimension-panels" className="block text-sm font-medium text-gray-700 mb-2">
                Panels
              </label>
              <input
                id="dimension-panels"
                type="number"
                value={panels}
                onChange={(e) => setPanels(e.target.value)}
                placeholder="1"
                min="1"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          </div>

          {/* Unit Price */}
          <div>
            <label htmlFor="dimension-price" className="block text-sm font-medium text-gray-700 mb-2">
              Unit Price (₦ per sqm) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
              <input
                id="dimension-price"
                type="text"
                value={unitPrice ? parseFloat(unitPrice).toLocaleString('en-US') : ''}
                onChange={(e) => setUnitPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          </div>

          {/* Calculated Total */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Calculated Total:</span>
              <span className="text-xl font-bold text-gray-900">{formatNaira(calculatedTotal())}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {width && height && quantity && `${width}mm × ${height}mm × ${quantity} qty`}
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white p-6 pt-4 border-t border-gray-200 rounded-b-3xl space-y-3">
          <button
            onClick={handleAdd}
            className="w-full py-4 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors"
          >
            {editingItem ? 'Update Dimension' : 'Add Dimension'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DimensionInputModal;
