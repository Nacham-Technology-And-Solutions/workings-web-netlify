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
} from '@/types/estimation';
import { estimationService } from '@/services/api/estimation.service';
import { templatesService } from '@/services/api/templates.service';
import { buildDefaultQuoteSettings } from '@/utils/estimationDefaults';
import { extractErrorMessage } from '@/utils/errorHandler';
import { getApiResponseData } from '@/utils/apiResponseHelper';
import { applyUserLibraryToPricingInputs } from '@/utils/materialPriceHelpers';

export type EstimationPreviewResult =
  | EstimationPreviewProjectCartResponse['response']
  | EstimationPreviewMaterialListResponse['response'];

interface EstimationState {
  projectId: number | null;
  fillSource: PriceFillSource;
  pricingInputs: PricingInput[];
  quoteSettings: QuoteSettings;
  previewResult: EstimationPreviewResult | null;
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
  preview: (quoteSource: 'project_cart' | 'material_list') => Promise<EstimationPreviewResult | null>;
  setItemOverride: (lineIndex: number, finalUnitPrice: number) => void;
  clearItemOverride: (lineIndex: number) => void;
  saveQuote: (
    request: Omit<EstimationQuoteRequest, 'pricingInputs' | 'quoteSettings' | 'projectId' | 'itemOverrides'>
  ) => Promise<EstimationSavedQuote | null>;
  reset: () => void;
}

const defaultQuoteSettings = buildDefaultQuoteSettings();

export const useEstimationStore = create<EstimationState>((set, get) => ({
  projectId: null,
  fillSource: 'last_used',
  pricingInputs: [],
  quoteSettings: defaultQuoteSettings,
  previewResult: null,
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
    set({ isLoadingFill: true, error: null, projectId, fillSource });
    try {
      const response = await estimationService.getPriceFill(projectId, fillSource);
      const data = response.response;
      let pricingInputs = data.pricingInputs;

      if (fillSource === 'user_library') {
        const library = await templatesService.getMaterialPrices();
        const applied = applyUserLibraryToPricingInputs(pricingInputs, library);
        pricingInputs = applied.inputs;
      }

      set({
        fillSource,
        pricingInputs,
        previewResult: null,
        isLoadingFill: false,
      });
    } catch (err) {
      set({
        isLoadingFill: false,
        error: extractErrorMessage(err).message,
      });
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
    }));
  },

  updateQuoteSettings: (settings) => {
    set((state) => ({
      quoteSettings: { ...state.quoteSettings, ...settings },
      previewResult: null,
    }));
  },

  updateExtraCharges: (charges) => {
    set((state) => ({
      quoteSettings: {
        ...state.quoteSettings,
        extraCharges: { ...state.quoteSettings.extraCharges, ...charges },
      },
      previewResult: null,
    }));
  },

  preview: async (quoteSource) => {
    const { projectId, pricingInputs, quoteSettings } = get();
    if (!projectId) {
      set({ error: 'Project ID is required for estimation preview' });
      return null;
    }
    set({ isPreviewing: true, error: null });
    try {
      const response = await estimationService.preview({
        quoteSource,
        projectId,
        pricingInputs,
        quoteSettings,
      });
      const result = getApiResponseData(response) as EstimationPreviewResult;
      set({ previewResult: result, isPreviewing: false, itemOverrides: [] });
      return result;
    } catch (err) {
      set({ isPreviewing: false, error: extractErrorMessage(err).message });
      return null;
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

  reset: () =>
    set({
      projectId: null,
      fillSource: 'last_used',
      pricingInputs: [],
      quoteSettings: buildDefaultQuoteSettings(),
      previewResult: null,
      itemOverrides: [],
      isLoadingFill: false,
      isPreviewing: false,
      isSaving: false,
      error: null,
    }),
}));
