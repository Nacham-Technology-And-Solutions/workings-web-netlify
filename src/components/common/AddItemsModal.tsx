import React, { useState, useEffect } from 'react';

interface AddItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selection: 'dimension' | 'material') => void;
  initialSelection: 'dimension' | 'material';
}

const AddItemsModal: React.FC<AddItemsModalProps> = ({ isOpen, onClose, onConfirm, initialSelection }) => {
  const [selection, setSelection] = useState(initialSelection);

  useEffect(() => {
    if (isOpen) {
      setSelection(initialSelection);
    }
  }, [isOpen, initialSelection]);

  const handleConfirm = () => {
    onConfirm(selection);
  };

  const handleSelect = (key: 'dimension' | 'material') => {
    setSelection(key);
  };

  const RadioButton = ({ checked }: { checked: boolean }) => (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors border-2 ${
      checked ? 'border-blue-500' : 'border-gray-400'
    }`}>
      {checked && <div className="w-3.5 h-3.5 bg-blue-500 rounded-full"></div>}
    </div>
  );

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true"></div>
      <div className={`relative bg-white rounded-2xl shadow-lg w-full max-w-sm mx-4 transition-transform transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Add Items From</h2>
          <p className="text-gray-500 mb-6">Select a list to pull items into your quote</p>

          <div className="space-y-2">
            <button
              onClick={() => handleSelect('dimension')}
              className="w-full flex items-center justify-between p-3 text-left border-b border-gray-200"
            >
              <span className="text-gray-800 text-lg">Dimension List</span>
              <RadioButton checked={selection === 'dimension'} />
            </button>
            <button
              onClick={() => handleSelect('material')}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <span className="text-gray-800 text-lg">Material List</span>
              <RadioButton checked={selection === 'material'} />
            </button>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-8 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItemsModal;
