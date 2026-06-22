import React from 'react';
import type { MaterialListQuoteLine } from '@/types/estimation';
import { formatEstimationUnit } from '@/utils/estimationDisplay';

export interface MaterialBomItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  quantityLabel?: string;
}

interface MaterialBomPricedItemProps {
  item: MaterialBomItem;
  quantityDisplay: string;
  isExpanded: boolean;
  onToggle: () => void;
  estimationMode: boolean;
  pricedLine?: MaterialListQuoteLine;
  isPreviewing?: boolean;
  legacyUnitPrice?: number;
  legacyLineTotal?: number;
  onLegacyPriceChange?: (price: number) => void;
}

const formatMoney = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MaterialBomPricedItem: React.FC<MaterialBomPricedItemProps> = ({
  item,
  quantityDisplay,
  isExpanded,
  onToggle,
  estimationMode,
  pricedLine,
  isPreviewing = false,
  legacyUnitPrice = 0,
  legacyLineTotal = 0,
  onLegacyPriceChange,
}) => {
  const unitPrice = estimationMode ? pricedLine?.unitPrice : legacyUnitPrice;
  const lineTotal = estimationMode ? pricedLine?.totalPrice : legacyLineTotal;
  const pricedUnit = estimationMode ? pricedLine?.unit : item.unit;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex justify-between items-center py-3 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-3"
      >
        <span className="text-gray-900 font-normal text-left">{item.name}</span>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded whitespace-nowrap">
            {quantityDisplay}
          </span>
          {estimationMode && (
            <span className="hidden sm:inline text-sm text-gray-600 whitespace-nowrap">
              {isPreviewing && !pricedLine ? (
                '…'
              ) : pricedLine ? (
                <>
                  ₦{formatMoney(unitPrice ?? 0)}
                  {pricedUnit ? ` / ${formatEstimationUnit(pricedUnit)}` : ''}
                  {' · '}
                  <strong className="text-gray-900">₦{formatMoney(lineTotal ?? 0)}</strong>
                </>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </span>
          )}
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
        <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Item</span>
            <span className="text-gray-900 font-medium">{item.name}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Quantity</span>
            <span className="text-gray-900 font-medium">{quantityDisplay}</span>
          </div>

          {estimationMode ? (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Unit price</span>
                <span className="text-gray-900">
                  {pricedLine ? `₦${formatMoney(pricedLine.unitPrice)}` : '—'}
                  {pricedLine?.unit ? (
                    <span className="text-gray-500"> / {formatEstimationUnit(pricedLine.unit)}</span>
                  ) : null}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-600">Line total</span>
                <span className="text-gray-900 font-bold">
                  {pricedLine ? `₦${formatMoney(pricedLine.totalPrice)}` : '—'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Priced by the estimation engine. Edit unit prices in Estimation pricing above.
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Price</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-900">₦</span>
                  <input
                    type="number"
                    placeholder="Enter your price..."
                    value={legacyUnitPrice || ''}
                    onChange={(e) => onLegacyPriceChange?.(parseFloat(e.target.value) || 0)}
                    className="w-32 px-2 py-1 border-b border-gray-300 text-right text-gray-900 focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-600">Total</span>
                <span className="text-gray-900 font-bold">₦{formatMoney(legacyLineTotal)}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MaterialBomPricedItem;
