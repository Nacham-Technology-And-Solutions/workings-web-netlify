import React, { useEffect, useState } from 'react';
import type { EstimationSavedQuote } from '@/types/estimation';
import { useEstimationStore } from '@/stores/estimationStore';
import { formatNaira, formatNumber } from '@/utils/formatters';
import { CloseIcon } from '@/assets/icons/IconComponents';
import { FormattedAmountInput } from '@/components/common/FormattedAmountInput';

interface GenerateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  onQuoteSaved: (quote: EstimationSavedQuote) => void;
}

const GenerateQuoteModal: React.FC<GenerateQuoteModalProps> = ({
  isOpen,
  onClose,
  projectId,
  customerName,
  customerAddress,
  customerEmail,
  onQuoteSaved,
}) => {
  const {
    preview,
    previewResult,
    isPreviewing,
    isSaving,
    error,
    itemOverrides,
    setItemOverride,
    clearItemOverride,
    saveQuote,
    setProjectId,
  } = useEstimationStore();

  const [quoteSource, setQuoteSource] = useState<'project_cart' | 'material_list'>('project_cart');
  const [tax, setTax] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [expandedBreakdown, setExpandedBreakdown] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || !projectId) return;
    setLocalError(null);
    if (useEstimationStore.getState().projectId !== projectId) {
      setProjectId(projectId);
    }
    void preview(quoteSource);
  }, [isOpen, projectId, quoteSource, preview, setProjectId]);

  const handleQuoteSourceChange = (source: 'project_cart' | 'material_list') => {
    setQuoteSource(source);
    setExpandedBreakdown(null);
  };

  const handleSave = async () => {
    if (!customerName.trim()) {
      setLocalError('Customer name is required');
      return;
    }
    setLocalError(null);
    const quote = await saveQuote({
      quoteSource,
      quoteType: 'from_project',
      customerName: customerName.trim(),
      customerAddress: customerAddress?.trim() || undefined,
      customerEmail: customerEmail?.trim() || undefined,
      tax,
      status: 'draft',
      generatePdf: true,
    });
    if (quote) {
      onQuoteSaved(quote);
      onClose();
    }
  };

  const getOverridePrice = (lineIndex: number, calculated: number): number => {
    const override = itemOverrides.find((o) => o.lineIndex === lineIndex);
    return override?.finalUnitPrice ?? calculated;
  };

  if (!isOpen) return null;

  const displayError = localError || error;
  const isCart = previewResult?.quoteSource === 'project_cart';
  const cartLines = isCart && 'cartLines' in previewResult ? previewResult.cartLines : [];
  const materialLines =
    previewResult?.quoteSource === 'material_list' && 'lines' in previewResult
      ? previewResult.lines
      : [];

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white w-full sm:max-w-3xl max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Generate quote</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Close">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <p className="text-sm text-gray-700 mb-3">Quote type</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quoteSource"
                  checked={quoteSource === 'project_cart'}
                  onChange={() => handleQuoteSourceChange('project_cart')}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-900">Project cart (sell per window)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quoteSource"
                  checked={quoteSource === 'material_list'}
                  onChange={() => handleQuoteSourceChange('material_list')}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-900">Material list (project buy price)</span>
              </label>
            </div>
          </div>

          {displayError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 whitespace-pre-wrap">
              {displayError}
            </div>
          )}

          {isPreviewing ? (
            <p className="text-sm text-gray-500 py-8 text-center">Calculating preview…</p>
          ) : previewResult ? (
            <>
              {isCart ? (
                <div className="space-y-3">
                  {cartLines.map((line, index) => {
                    const finalPrice = getOverridePrice(index, line.finalUnitPrice);
                    const qty = line.quantity;
                    const lineTotal = finalPrice * qty;
                    const hasOverride = itemOverrides.some((o) => o.lineIndex === index);
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{line.description}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Qty {qty}
                              {line.width != null && line.height != null
                                ? ` · ${line.width} × ${line.height} mm`
                                : ''}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Engine: {formatNaira(line.calculatedUnitPrice)} / unit
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <label className="text-xs text-gray-500">Final unit price</label>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-sm">₦</span>
                              <FormattedAmountInput
                                value={finalPrice}
                                onValueChange={(val) => {
                                  if (val === line.finalUnitPrice && !hasOverride) {
                                    clearItemOverride(index);
                                  } else {
                                    setItemOverride(index, val);
                                  }
                                }}
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-right text-sm font-medium text-gray-900"
                              />
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              Line: {formatNaira(lineTotal)}
                            </p>
                          </div>
                        </div>
                        {line.costBreakdown?.length > 0 && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedBreakdown(expandedBreakdown === index ? null : index)
                              }
                              className="text-xs text-gray-600 hover:text-gray-900 underline"
                            >
                              {expandedBreakdown === index ? 'Hide' : 'Show'} cost breakdown
                            </button>
                            {expandedBreakdown === index && (
                              <ul className="mt-2 text-xs text-gray-600 space-y-1 pl-2 border-l-2 border-gray-200">
                                {line.costBreakdown.map((b, i) => (
                                  <li key={i}>
                                    {b.itemName}: {formatNumber(b.qty)} {b.unit} × {formatNaira(b.unitPrice)} ={' '}
                                    {formatNaira(b.lineTotal)}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="py-2 pr-4 font-medium">Description</th>
                        <th className="py-2 pr-4 font-medium">Qty</th>
                        <th className="py-2 pr-4 font-medium text-right">Unit</th>
                        <th className="py-2 pr-4 font-medium text-right">Unit price</th>
                        <th className="py-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materialLines.map((line) => (
                        <tr key={line.itemKey} className="border-b border-gray-100">
                          <td className="py-2 pr-4 text-gray-900">{line.description}</td>
                          <td className="py-2 pr-4 text-gray-600">{formatNumber(line.quantity)}</td>
                          <td className="py-2 pr-4 text-right text-gray-600">{line.unit}</td>
                          <td className="py-2 pr-4 text-right text-gray-900">
                            {formatNaira(line.unitPrice)}
                          </td>
                          <td className="py-2 text-right font-medium text-gray-900">
                            {formatNaira(line.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatNaira(previewResult.subtotal)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900">Grand total (incl. extras)</span>
                  <span className="text-gray-900">{formatNaira(previewResult.grandTotal)}</span>
                </div>
                <label className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Tax (on save)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">₦</span>
                    <FormattedAmountInput
                      value={tax || ''}
                      onValueChange={(val) => setTax(Math.min(previewResult.grandTotal, Math.max(0, val)))}
                      className="w-28 px-2 py-1 border border-gray-300 rounded text-right font-medium text-gray-900"
                    />
                  </div>
                </label>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Total after tax</span>
                  <span>{formatNaira(previewResult.grandTotal + tax)}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 py-8 text-center">
              Preview unavailable. Check pricing and try again.
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void preview(quoteSource, { force: true })}
            disabled={isPreviewing || isSaving}
            className="px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh preview
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isPreviewing || isSaving || !previewResult}
            className="px-4 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save quote (3 pts)'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateQuoteModal;
