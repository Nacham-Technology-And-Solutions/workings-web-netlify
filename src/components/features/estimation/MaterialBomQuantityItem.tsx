import React from 'react';

export interface MaterialBomItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  quantityLabel?: string;
}

interface MaterialBomQuantityItemProps {
  item: MaterialBomItem;
  quantityDisplay: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const MaterialBomQuantityItem: React.FC<MaterialBomQuantityItemProps> = ({
  item,
  quantityDisplay,
  isExpanded,
  onToggle,
}) => (
  <div>
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex justify-between items-center py-3 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-3"
    >
      <span className="text-gray-900 font-normal text-left">{item.name}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded whitespace-nowrap">
          {quantityDisplay}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>

    {isExpanded && (
      <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Item</span>
          <span className="text-gray-900 font-medium">{item.name}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Quantity</span>
          <span className="text-gray-900 font-medium">{quantityDisplay}</span>
        </div>
      </div>
    )}
  </div>
);

export default MaterialBomQuantityItem;
