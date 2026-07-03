import { create } from 'zustand';
import type {
  PriceFillSource,
  PricingInput,
  QuoteSettings,
  CartQuoteItemOverride,
  EstimationPreviewProjectCartResponse,
  EstimationPreviewMaterialListResponse,
  EstimationQuoteRequest,
  EstimationSavedQuote,
  EstimationSaveResponse,
  EstimationBootstrap,
} from '@/types/estimation';
import { estimationService } from '@/services/api/estimation.service';
import { buildDefaultQuoteSettings } from '@/utils/estimationDefaults';
import { extractErrorMessage } from '@/utils/errorHandler';
import { getApiResponseData } from '@/utils/apiResponseHelper';
import { computePreviewInputsHash } from '@/utils/estimationPreviewCache';

export type EstimationPreviewResult =
  | EstimationPreviewProjectCartResponse['response']
  | EstimationPreviewMaterialListResponse['response'];

interface EstimationState {
  projectId: number | null;
  fillSource: PriceFillSource;
  pricingInputs: PricingInput[];
  quoteSettings: QuoteSettings;
  previewResult: EstimationPreviewResult | null;
  previewInputsHash: string | null;
  itemOverrides: CartQuoteItemOverride[];
  isLoadingFill: boolean;
  isPreviewing: boolean;
  isSaving: boolean;
  error: string | null;

  setProjectId: (id: number | null) => void;
  initFromProjectSettings: (calculationSettings?: {
    stockLength?: number;
    bladeKerf?: number;
    netRoll?: string | { widthMm?: number; lengthMm?: number };
  }) => void;
  setFillSource: (source: PriceFillSource) => void;
  loadPriceFill: (projectId: number, source?: PriceFillSource) => Promise<void>;
  updatePricingInput: (itemKey: string, unitPrice: number) => void;
  updateQuoteSettings: (settings: Partial<QuoteSettings>) => void;
  updateExtraCharges: (charges: Partial<QuoteSettings['extraCharges']>) => void;
  preview: (
    quoteSource: 'project_cart' | 'material_list',
    options?: { force?: boolean }
  ) => Promise<EstimationPreviewResult | null>;
  setItemOverride: (lineIndex: number, finalUnitPrice: number) => void;
  clearItemOverride: (lineIndex: number) => void;
  saveQuote: (
    request: Omit<EstimationQuoteRequest, 'pricingInputs' | 'quoteSettings' | 'projectId' | 'itemOverrides'>
  ) => Promise<EstimationSavedQuote | null>;
  seedFromBootstrap: (bootstrap: EstimationBootstrap) => void;
  reset: () => void;
}

const defaultQuoteSettings = buildDefaultQuoteSettings();

let inflightPriceFill: { key: string; promise: Promise<void> } | null = null;
let inflightPreview: { key: string; promise: Promise<EstimationPreviewResult | null> } | null = null;

export const useEstimationStore = create<EstimationState>((set, get) => ({
  projectId: null,
  fillSource: 'last_used',
  pricingInputs: [],
  quoteSettings: defaultQuoteSettings,
  previewResult: null,
  previewInputsHash: null,
  itemOverrides: [],
  isLoadingFill: false,
  isPreviewing: false,
  isSaving: false,
  error: null,

  setProjectId: (id) => set({ projectId: id }),

  initFromProjectSettings: (calculationSettings) => {
    set({ quoteSettings: buildDefaultQuoteSettings(calculationSettings) });
  },

  setFillSource: (source) => set({ fillSource: source }),

  loadPriceFill: async (projectId, source) => {
    const fillSource = source ?? get().fillSource;
    const key = `${projectId}:${fillSource}`;

    if (inflightPriceFill?.key === key) {
      return inflightPriceFill.promise;
    }

    const run = async () => {
      set({ isLoadingFill: true, error: null, projectId, fillSource });
      try {
        const response = await estimationService.getPriceFill(projectId, fillSource);
        const data = response.response;
        const pricingInputs = data.pricingInputs;

        set({
          fillSource,
          pricingInputs,
          previewResult: null,
          previewInputsHash: null,
          isLoadingFill: false,
        });
      } catch (err) {
        set({
          isLoadingFill: false,
          error: extractErrorMessage(err).message,
        });
      }
    };

    const promise = run();
    inflightPriceFill = { key, promise };
    try {
      await promise;
    } finally {
      if (inflightPriceFill?.key === key) {
        inflightPriceFill = null;
      }
    }
  },

  updatePricingInput: (itemKey, unitPrice) => {
    set((state) => ({
      pricingInputs: state.pricingInputs.map((row) =>
        row.itemKey === itemKey
          ? { ...row, unitPrice, source: 'manual' as const }
          : row
      ),
      previewResult: null,
      previewInputsHash: null,
    }));
  },

  updateQuoteSettings: (settings) => {
    set((state) => ({
      quoteSettings: { ...state.quoteSettings, ...settings },
      previewResult: null,
      previewInputsHash: null,
    }));
  },

  updateExtraCharges: (charges) => {
    set((state) => ({
      quoteSettings: {
        ...state.quoteSettings,
        extraCharges: { ...state.quoteSettings.extraCharges, ...charges },
      },
      previewResult: null,
      previewInputsHash: null,
    }));
  },

  preview: async (quoteSource, options) => {
    const { projectId, pricingInputs, quoteSettings, previewResult, previewInputsHash } = get();
    if (!projectId) {
      set({ error: 'Project ID is required for estimation preview' });
      return null;
    }

    const hash = computePreviewInputsHash(quoteSource, pricingInputs, quoteSettings);
    if (
      !options?.force &&
      previewResult &&
      previewResult.quoteSource === quoteSource &&
      previewInputsHash === hash
    ) {
      return previewResult;
    }

    const key = `${projectId}:${quoteSource}:${hash}`;
    if (inflightPreview?.key === key) {
      return inflightPreview.promise;
    }

    const run = async (): Promise<EstimationPreviewResult | null> => {
      set({ isPreviewing: true, error: null });
      try {
        const response = await estimationService.preview({
          quoteSource,
          projectId,
          pricingInputs,
          quoteSettings,
        });
        const result = getApiResponseData(response) as EstimationPreviewResult;
        set({
          previewResult: result,
          previewInputsHash: hash,
          isPreviewing: false,
          itemOverrides: [],
        });
        return result;
      } catch (err) {
        set({ isPreviewing: false, error: extractErrorMessage(err).message });
        return null;
      }
    };

    const promise = run();
    inflightPreview = { key, promise };
    try {
      return await promise;
    } finally {
      if (inflightPreview?.key === key) {
        inflightPreview = null;
      }
    }
  },

  setItemOverride: (lineIndex, finalUnitPrice) => {
    set((state) => {
      const existing = state.itemOverrides.filter((o) => o.lineIndex !== lineIndex);
      return {
        itemOverrides: [
          ...existing,
          { lineIndex, finalUnitPrice, manualOverride: true },
        ],
      };
    });
  },

  clearItemOverride: (lineIndex) => {
    set((state) => ({
      itemOverrides: state.itemOverrides.filter((o) => o.lineIndex !== lineIndex),
    }));
  },

  saveQuote: async (request) => {
    const { projectId, pricingInputs, quoteSettings, itemOverrides } = get();
    if (!projectId) {
      set({ error: 'Project ID is required to save quote' });
      return null;
    }
    set({ isSaving: true, error: null });
    try {
      const response = await estimationService.createQuote({
        ...request,
        projectId,
        pricingInputs,
        quoteSettings,
        itemOverrides: itemOverrides.length > 0 ? itemOverrides : undefined,
      });
      const data = getApiResponseData(response) as EstimationSaveResponse['response'];
      set({ isSaving: false });
      return data.quote;
    } catch (err) {
      set({ isSaving: false, error: extractErrorMessage(err).message });
      return null;
    }
  },

  seedFromBootstrap: (bootstrap) => {
    set({
      projectId: bootstrap.projectId,
      fillSource: bootstrap.fillSource,
      pricingInputs: bootstrap.pricingInputs,
      previewResult: null,
      previewInputsHash: null,
      itemOverrides: [],
      isLoadingFill: false,
      error: null,
    });
  },

  reset: () =>
    set({
      projectId: null,
      fillSource: 'last_used',
      pricingInputs: [],
      quoteSettings: buildDefaultQuoteSettings(),
      previewResult: null,
      previewInputsHash: null,
      itemOverrides: [],
      isLoadingFill: false,
      isPreviewing: false,
      isSaving: false,
      error: null,
    }),
}));
