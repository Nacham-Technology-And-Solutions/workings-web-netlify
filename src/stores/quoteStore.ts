import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuotePreviewData, QuoteOverviewData, QuoteItemListData, QuoteExtrasNotesData, QuoteItemRow } from '@/types/quote';
import type { ProjectMeasurementData } from '@/types/project';
import type { CalculationResult } from '@/types/calculations';
import type { CartQuoteItemOverride, PricingInput } from '@/types/estimation';

export interface EstimationDraft {
  projectId: number;
  quoteSource: 'project_cart' | 'material_list';
  baseItems: QuoteItemRow[];
  pricingInputs: PricingInput[];
  itemOverrides: CartQuoteItemOverride[];
  marginPercent: number;
  offcutMarkup: number;
}

interface QuoteState {
  generatedQuote: QuotePreviewData | null;
  selectedQuoteId: string | null;
  standaloneQuoteData: {
    overview?: QuoteOverviewData;
    itemList?: QuoteItemListData;
    extrasNotes?: QuoteExtrasNotesData;
    projectData?: {
      calculationResult?: CalculationResult;
      projectMeasurement?: ProjectMeasurementData;
    };
  } | null;
  estimationDraft: EstimationDraft | null;
  editingQuoteId: string | null;
  quoteClientReference: string | null;

  setGeneratedQuote: (quote: QuotePreviewData | null) => void;
  setSelectedQuoteId: (id: string | null) => void;
  clearGeneratedQuote: () => void;
  setStandaloneQuoteData: (data: QuoteState['standaloneQuoteData']) => void;
  updateStandaloneQuoteOverview: (data: QuoteOverviewData) => void;
  updateStandaloneQuoteItemList: (data: QuoteItemListData) => void;
  updateStandaloneQuoteExtrasNotes: (data: QuoteExtrasNotesData) => void;
  clearStandaloneQuoteData: () => void;
  setEstimationDraft: (draft: EstimationDraft | null) => void;
  updateEstimationDraftMargin: (marginPercent: number, adjustedItems: QuoteItemRow[]) => void;
  clearEstimationDraft: () => void;
  setEditingQuoteId: (id: string | null) => void;
  ensureQuoteClientReference: () => string;
  clearQuoteClientReference: () => void;
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      generatedQuote: null,
      selectedQuoteId: null,
      standaloneQuoteData: null,
      estimationDraft: null,
      editingQuoteId: null,
      quoteClientReference: null,

      setGeneratedQuote: (quote) => set({ generatedQuote: quote }),
      setSelectedQuoteId: (id) => set({ selectedQuoteId: id }),
      clearGeneratedQuote: () => set({ generatedQuote: null }),
      setStandaloneQuoteData: (data) => set({ standaloneQuoteData: data }),
      updateStandaloneQuoteOverview: (data) => set((state) => {
        const existingData = state.standaloneQuoteData || {};
        const projectData = state.standaloneQuoteData?.projectData;
        const updated = { ...existingData, overview: data };
        if (projectData) updated.projectData = projectData;
        return { standaloneQuoteData: updated };
      }),
      updateStandaloneQuoteItemList: (data) => set((state) => {
        const existingData = state.standaloneQuoteData || {};
        const projectData = state.standaloneQuoteData?.projectData;
        const updated = { ...existingData, itemList: data };
        if (projectData) updated.projectData = projectData;
        return { standaloneQuoteData: updated };
      }),
      updateStandaloneQuoteExtrasNotes: (data) => set((state) => {
        const existingData = state.standaloneQuoteData || {};
        const projectData = state.standaloneQuoteData?.projectData;
        const updated = { ...existingData, extrasNotes: data };
        if (projectData) updated.projectData = projectData;
        return { standaloneQuoteData: updated };
      }),
      clearStandaloneQuoteData: () =>
        set({ standaloneQuoteData: null, estimationDraft: null, quoteClientReference: null }),
      setEstimationDraft: (draft) => set({ estimationDraft: draft }),
      updateEstimationDraftMargin: (marginPercent, adjustedItems) =>
        set((state) => {
          if (!state.estimationDraft) return state;
          const subtotal = adjustedItems.reduce((s, i) => s + i.total, 0);
          return {
            estimationDraft: { ...state.estimationDraft, marginPercent },
            standaloneQuoteData: state.standaloneQuoteData
              ? {
                  ...state.standaloneQuoteData,
                  itemList: {
                    listType:
                      state.estimationDraft.quoteSource === 'project_cart' ? 'dimension' : 'material',
                    items: adjustedItems,
                    subtotal,
                  },
                }
              : state.standaloneQuoteData,
          };
        }),
      clearEstimationDraft: () => set({ estimationDraft: null }),
      setEditingQuoteId: (id) => set({ editingQuoteId: id }),
      ensureQuoteClientReference: () => {
        const existing = get().quoteClientReference;
        if (existing) return existing;
        const ref = crypto.randomUUID();
        set({ quoteClientReference: ref });
        return ref;
      },
      clearQuoteClientReference: () => set({ quoteClientReference: null }),
    }),
    {
      name: 'quote-storage',
      partialize: (state) => ({
        generatedQuote: state.generatedQuote,
        selectedQuoteId: state.selectedQuoteId,
        standaloneQuoteData: state.standaloneQuoteData,
        estimationDraft: state.estimationDraft,
        editingQuoteId: state.editingQuoteId,
        quoteClientReference: state.quoteClientReference,
      }),
    }
  )
);
