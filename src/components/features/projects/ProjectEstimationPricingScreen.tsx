import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ProjectDescriptionData, SelectProjectData, ProjectMeasurementData } from '@/types';
import type { CalculationResult } from '@/types/calculations';
import type { PriceFillSource } from '@/types/estimation';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';
import { useEstimationStore } from '@/stores/estimationStore';
import { createProjectData } from '@/utils/dataTransformers';
import { pricingSourceBadgeClass, pricingSourceLabel, formatEstimationUnit } from '@/utils/estimationDisplay';
import { ESTIMATION_PRICE_FILL_STORAGE_KEY } from '@/utils/estimationQuoteMappers';
import EstimationQuotePreviewModal, {
  type EstimationPreviewAcceptedPayload,
} from '@/components/features/estimation/EstimationQuotePreviewModal';

const FILL_OPTIONS: { value: PriceFillSource; label: string }[] = [
  { value: 'system', label: 'System prices' },
  { value: 'user_library', label: 'My prices' },
  { value: 'last_used', label: 'Last used' },
];

const formatMoney = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function readStoredFillSource(): PriceFillSource {
  if (typeof window === 'undefined') return 'last_used';
  const stored = localStorage.getItem(ESTIMATION_PRICE_FILL_STORAGE_KEY);
  if (stored === 'system' || stored === 'user_library' || stored === 'last_used') {
    return stored;
  }
  return 'last_used';
}

interface ProjectEstimationPricingScreenProps {
  onBack: () => void;
  projectId: number;
  previousData: {
    projectDescription?: ProjectDescriptionData;
    selectProject?: SelectProjectData;
    projectMeasurement?: ProjectMeasurementData;
  };
  calculationResult?: CalculationResult | null;
  onPreviewAccepted: (payload: EstimationPreviewAcceptedPayload) => void;
}

const ProjectEstimationPricingScreen: React.FC<ProjectEstimationPricingScreenProps> = ({
  onBack,
  projectId,
  previousData,
  onPreviewAccepted,
}) => {
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
    initFromProjectSettings,
    setProjectId: setEstimationProjectId,
    preview: runEstimationPreview,
    updateExtraCharges,
  } = useEstimationStore();

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const bootstrappedRef = useRef(false);

  const pricingSnapshot = useMemo(
    () => JSON.stringify({ pricingInputs, quoteSettings }),
    [pricingInputs, quoteSettings]
  );

  useEffect(() => {
    if (bootstrappedRef.current) return;
    if (!previousData.projectDescription || !previousData.selectProject || !previousData.projectMeasurement) {
      return;
    }
    bootstrappedRef.current = true;
    const projectData = createProjectData(
      previousData.projectDescription,
      previousData.selectProject,
      previousData.projectMeasurement
    );
    initFromProjectSettings(projectData.calculationSettings);
    updateExtraCharges({ profitPercent: 0, labour: 0, transport: 0, miscellaneous: 0 });
    setEstimationProjectId(projectId);
    const source = readStoredFillSource();
    setFillSource(source);
    void loadPriceFill(projectId, source);
  }, [previousData, projectId, initFromProjectSettings, setEstimationProjectId, loadPriceFill, setFillSource]);

  useEffect(() => {
    if (!projectId || pricingInputs.length === 0) return;
    const timer = window.setTimeout(() => {
      void runEstimationPreview('material_list');
    }, 500);
    return () => window.clearTimeout(timer);
  }, [projectId, pricingSnapshot, pricingInputs.length, runEstimationPreview]);

  const handleFillSourceChange = async (source: PriceFillSource) => {
    localStorage.setItem(ESTIMATION_PRICE_FILL_STORAGE_KEY, source);
    setFillSource(source);
    await loadPriceFill(projectId, source);
  };

  const previewSubtotal =
    previewResult?.quoteSource === 'material_list' ? previewResult.subtotal : null;

  const libraryMatchedCount = pricingInputs.filter((row) => row.source === 'user_library').length;

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] font-sans text-gray-800">
      <div className="px-4 md:px-8 py-4 md:py-6 border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button type="button" onClick={onBack} className="text-gray-600 hover:text-gray-900 p-1 -ml-1" aria-label="Go back">
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Estimation pricing</h1>
          </div>
          <p className="text-sm text-gray-500 ml-9 md:ml-10">
            Fill unit prices from your library, then generate a quote preview.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-28 md:pb-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <label htmlFor="price-fill-source" className="text-sm font-medium text-gray-700">
                Price from
              </label>
              <div className="flex items-center gap-2">
                <select
                  id="price-fill-source"
                  value={fillSource}
                  onChange={(e) => void handleFillSourceChange(e.target.value as PriceFillSource)}
                  disabled={isLoadingFill}
                  className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:opacity-50"
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
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
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
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                {libraryMatchedCount === pricingInputs.length
                  ? `All ${pricingInputs.length} items filled from your Material Prices library.`
                  : `${libraryMatchedCount} of ${pricingInputs.length} items matched your library.`}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {error}
              </div>
            )}

            {isLoadingFill && pricingInputs.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">Loading prices…</p>
            ) : pricingInputs.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">No pricing rows yet. Run calculate first.</p>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="py-2 pr-4 font-medium">Item</th>
                        <th className="py-2 pr-4 font-medium">Category</th>
                        <th className="py-2 pr-4 font-medium">Unit</th>
                        <th className="py-2 pr-4 font-medium">Source</th>
                        <th className="py-2 pr-4 font-medium text-right">Unit price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingInputs.map((row) => (
                        <tr key={row.itemKey} className="border-b border-gray-100">
                          <td className="py-2 pr-4 text-gray-900">{row.itemName}</td>
                          <td className="py-2 pr-4 text-gray-600">{row.category}</td>
                          <td className="py-2 pr-4 text-gray-600">{formatEstimationUnit(row.unit)}</td>
                          <td className="py-2 pr-4">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${pricingSourceBadgeClass(row.source)}`}
                            >
                              {pricingSourceLabel(row.source)}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <span className="text-gray-500">₦</span>
                              <input
                                type="number"
                                min={0}
                                value={row.unitPrice || ''}
                                onChange={(e) =>
                                  updatePricingInput(row.itemKey, parseFloat(e.target.value) || 0)
                                }
                                className="w-28 px-2 py-1 border border-gray-300 rounded text-right"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {pricingInputs.map((row) => (
                    <div key={row.itemKey} className="border border-gray-200 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-medium text-gray-900 text-sm">{row.itemName}</p>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${pricingSourceBadgeClass(row.source)}`}
                        >
                          {pricingSourceLabel(row.source)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {row.category} · {formatEstimationUnit(row.unit)}
                      </p>
                      <label className="block text-sm">
                        <span className="text-gray-600">Unit price (₦)</span>
                        <input
                          type="number"
                          min={0}
                          value={row.unitPrice || ''}
                          onChange={(e) =>
                            updatePricingInput(row.itemKey, parseFloat(e.target.value) || 0)
                          }
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}

            <label className="block text-sm mt-6 max-w-xs">
              <span className="text-gray-600 font-medium">Offcut markup (₦)</span>
              <input
                type="number"
                min={0}
                value={quoteSettings.offcutMarkup}
                onChange={(e) =>
                  updateQuoteSettings({ offcutMarkup: parseFloat(e.target.value) || 0 })
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </label>

            {pricingInputs.length > 0 && (
              <p className="mt-4 text-xs text-gray-500">
                {pricingInputs.length} item{pricingInputs.length !== 1 ? 's' : ''} priced
                {isPreviewing ? (
                  ' · Updating subtotal…'
                ) : previewSubtotal != null ? (
                  <> · Materials subtotal ₦{formatMoney(previewSubtotal)}</>
                ) : null}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="fixed md:relative bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 md:px-8 py-4 z-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onBack}
            className="hidden sm:block px-4 py-3 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            disabled={pricingInputs.length === 0 || isLoadingFill}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            Generate Quote Preview
          </button>
        </div>
      </div>

      <EstimationQuotePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onAccepted={onPreviewAccepted}
      />
    </div>
  );
};

export default ProjectEstimationPricingScreen;
