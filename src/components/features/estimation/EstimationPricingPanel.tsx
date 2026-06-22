import React from 'react';
import type { PriceFillSource } from '@/types/estimation';
import { useEstimationStore } from '@/stores/estimationStore';
import { pricingSourceBadgeClass, pricingSourceLabel, formatEstimationUnit } from '@/utils/estimationDisplay';

const formatMoney = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface EstimationPricingPanelProps {
  projectId: number;
  className?: string;
}

const FILL_OPTIONS: { value: PriceFillSource; label: string }[] = [
  { value: 'system', label: 'System prices' },
  { value: 'user_library', label: 'My prices' },
  { value: 'last_used', label: 'Last used' },
];

const EstimationPricingPanel: React.FC<EstimationPricingPanelProps> = ({ projectId, className = '' }) => {
  const {
    fillSource,
    pricingInputs,
    quoteSettings,
    previewResult,
    isLoadingFill,
    isPreviewing,
    error,
    setFillSource,
    loadPriceFill,
    updatePricingInput,
    updateQuoteSettings,
    updateExtraCharges,
  } = useEstimationStore();

  const handleFillSourceChange = async (source: PriceFillSource) => {
    await loadPriceFill(projectId, source);
  };

  const libraryMatchedCount = pricingInputs.filter((row) => row.source === 'user_library').length;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-6 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Estimation pricing</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Fill unit prices from your library, then adjust quote settings before generating a quote.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <label htmlFor="price-fill-source" className="text-sm text-gray-600 whitespace-nowrap">
            Price fill:
          </label>
          <select
            id="price-fill-source"
            value={fillSource}
            onChange={(e) => handleFillSourceChange(e.target.value as PriceFillSource)}
            disabled={isLoadingFill}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >
            {FILL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => loadPriceFill(projectId, fillSource)}
            disabled={isLoadingFill}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {isLoadingFill ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {fillSource === 'user_library' && pricingInputs.length > 0 && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            libraryMatchedCount === pricingInputs.length
              ? 'border-green-200 bg-green-50 text-green-900'
              : libraryMatchedCount > 0
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          {libraryMatchedCount === pricingInputs.length ? (
            <>
              All {pricingInputs.length} items filled from your{' '}
              <strong>Material Prices</strong> library (Export Settings).
            </>
          ) : libraryMatchedCount > 0 ? (
            <>
              {libraryMatchedCount} of {pricingInputs.length} items matched your Material Prices
              library. Others use last saved or system prices — add missing materials in Export
              Settings with the same item key.
            </>
          ) : (
            <>
              No items matched your Material Prices library. Add prices in Export Settings →
              Material Prices (with item keys), then click Refresh. Unmatched rows keep last used
              prices.
            </>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {isLoadingFill && pricingInputs.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">Loading prices…</p>
      ) : pricingInputs.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          No pricing rows yet. Run calculate, then refresh prices.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 px-4 font-medium">Item</th>
                <th className="py-2 px-4 font-medium">Category</th>
                <th className="py-2 px-4 font-medium">Unit</th>
                <th className="py-2 px-4 font-medium">Source</th>
                <th className="py-2 px-4 font-medium text-right">Unit price</th>
              </tr>
            </thead>
            <tbody>
              {pricingInputs.map((row) => (
                <tr key={row.itemKey} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-4 text-gray-900">{row.itemName}</td>
                  <td className="py-2 px-4 text-gray-600">{row.category}</td>
                  <td className="py-2 px-4 text-gray-600">{formatEstimationUnit(row.unit)}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${pricingSourceBadgeClass(row.source)}`}
                    >
                      {pricingSourceLabel(row.source)}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <span className="text-gray-500">₦</span>
                      <input
                        type="number"
                        min={0}
                        value={row.unitPrice || ''}
                        onChange={(e) =>
                          updatePricingInput(row.itemKey, parseFloat(e.target.value) || 0)
                        }
                        className="w-28 px-2 py-1 border border-gray-300 rounded text-right text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <details className="mt-6 group">
        <summary className="cursor-pointer text-sm font-medium text-gray-900 list-none flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-90"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Quote settings
        </summary>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="block text-sm">
            <span className="text-gray-600">Stock length (mm)</span>
            <input
              type="number"
              value={quoteSettings.stockLength}
              onChange={(e) =>
                updateQuoteSettings({ stockLength: parseFloat(e.target.value) || 6000 })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Kerf (mm)</span>
            <input
              type="number"
              value={quoteSettings.kerf}
              onChange={(e) => updateQuoteSettings({ kerf: parseFloat(e.target.value) || 5 })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Offcut markup (₦)</span>
            <input
              type="number"
              value={quoteSettings.offcutMarkup}
              onChange={(e) =>
                updateQuoteSettings({ offcutMarkup: parseFloat(e.target.value) || 0 })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Glass sheet W × H (mm)</span>
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                value={quoteSettings.glassSheetWidth}
                onChange={(e) =>
                  updateQuoteSettings({ glassSheetWidth: parseFloat(e.target.value) || 3310 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                value={quoteSettings.glassSheetHeight}
                onChange={(e) =>
                  updateQuoteSettings({ glassSheetHeight: parseFloat(e.target.value) || 2140 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Net roll height (mm)</span>
            <select
              value={quoteSettings.netRollHeightMm}
              onChange={(e) =>
                updateQuoteSettings({ netRollHeightMm: parseInt(e.target.value, 10) })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value={1220}>1220</option>
              <option value={1500}>1500</option>
              <option value={1800}>1800</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Labour (₦)</span>
            <input
              type="number"
              value={quoteSettings.extraCharges?.labour ?? 0}
              onChange={(e) =>
                updateExtraCharges({ labour: parseFloat(e.target.value) || 0 })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Transport (₦)</span>
            <input
              type="number"
              value={quoteSettings.extraCharges?.transport ?? 0}
              onChange={(e) =>
                updateExtraCharges({ transport: parseFloat(e.target.value) || 0 })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Miscellaneous (₦)</span>
            <input
              type="number"
              value={quoteSettings.extraCharges?.miscellaneous ?? 0}
              onChange={(e) =>
                updateExtraCharges({ miscellaneous: parseFloat(e.target.value) || 0 })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Profit %</span>
            <input
              type="number"
              value={quoteSettings.extraCharges?.profitPercent ?? 0}
              onChange={(e) =>
                updateExtraCharges({ profitPercent: parseFloat(e.target.value) || 0 })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Discount %</span>
            <input
              type="number"
              value={quoteSettings.extraCharges?.discountPercent ?? 0}
              onChange={(e) =>
                updateExtraCharges({ discountPercent: parseFloat(e.target.value) || 0 })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>
        </div>
      </details>

      {pricingInputs.length > 0 && (
        <p className="mt-4 text-xs text-gray-500">
          {pricingInputs.length} item{pricingInputs.length !== 1 ? 's' : ''} priced
          {isPreviewing ? (
            <> · Updating material list totals…</>
          ) : previewResult?.quoteSource === 'material_list' ? (
            <>
              {' '}
              · Subtotal ₦{formatMoney(previewResult.subtotal)} · Grand total ₦
              {formatMoney(previewResult.grandTotal)}
            </>
          ) : (
            <> · Totals update as you edit prices</>
          )}
        </p>
      )}
    </div>
  );
};

export default EstimationPricingPanel;
