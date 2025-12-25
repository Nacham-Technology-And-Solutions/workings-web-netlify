import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuotePreviewData, Quote, QuoteOverviewData, QuoteItemListData, QuoteExtrasNotesData } from '@/types/quote';
import type { ProjectMeasurementData } from '@/types/project';
import type { CalculationResult } from '@/types/calculations';

interface QuoteState {
  // Generated quote (from project solution)
  generatedQuote: QuotePreviewData | null;
  
  // Selected quote for viewing
  selectedQuoteId: string | null;
  
  // Standalone quote flow data
  standaloneQuoteData: {
    overview?: QuoteOverviewData;
    itemList?: QuoteItemListData;
    extrasNotes?: QuoteExtrasNotesData;
    projectData?: {
      calculationResult?: CalculationResult;
      projectMeasurement?: ProjectMeasurementData;
    };
  } | null;
  
  // Editing quote ID (for edit flow)
  editingQuoteId: string | null;
  
  // Actions
  setGeneratedQuote: (quote: QuotePreviewData | null) => void;
  setSelectedQuoteId: (id: string | null) => void;
  clearGeneratedQuote: () => void;
  setStandaloneQuoteData: (data: QuoteState['standaloneQuoteData']) => void;
  updateStandaloneQuoteOverview: (data: QuoteOverviewData) => void;
  updateStandaloneQuoteItemList: (data: QuoteItemListData) => void;
  updateStandaloneQuoteExtrasNotes: (data: QuoteExtrasNotesData) => void;
  clearStandaloneQuoteData: () => void;
  setEditingQuoteId: (id: string | null) => void;
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set) => ({
      // Initial state
      generatedQuote: null,
      selectedQuoteId: null,
      standaloneQuoteData: null,
      editingQuoteId: null,
      
      // Actions
      setGeneratedQuote: (quote) => set({ generatedQuote: quote }),
      setSelectedQuoteId: (id) => set({ selectedQuoteId: id }),
      clearGeneratedQuote: () => set({ generatedQuote: null }),
      setStandaloneQuoteData: (data) => set({ standaloneQuoteData: data }),
      updateStandaloneQuoteOverview: (data) => set((state) => ({
        standaloneQuoteData: {
          ...state.standaloneQuoteData,
          overview: data,
        },
      })),
      updateStandaloneQuoteItemList: (data) => set((state) => ({
        standaloneQuoteData: {
          ...state.standaloneQuoteData,
          itemList: data,
        },
      })),
      updateStandaloneQuoteExtrasNotes: (data) => set((state) => ({
        standaloneQuoteData: {
          ...state.standaloneQuoteData,
          extrasNotes: data,
        },
      })),
      clearStandaloneQuoteData: () => set({ standaloneQuoteData: null }),
      setEditingQuoteId: (id) => set({ editingQuoteId: id }),
    }),
    {
      name: 'quote-storage',
      partialize: (state) => ({
        generatedQuote: state.generatedQuote,
        selectedQuoteId: state.selectedQuoteId,
        standaloneQuoteData: state.standaloneQuoteData,
        editingQuoteId: state.editingQuoteId,
      }),
    }
  )
);

