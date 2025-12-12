import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuotePreviewData, Quote } from '@/types/quote';

interface QuoteState {
  // Generated quote (from project solution)
  generatedQuote: QuotePreviewData | null;
  
  // Selected quote for viewing
  selectedQuoteId: string | null;
  
  // Actions
  setGeneratedQuote: (quote: QuotePreviewData | null) => void;
  setSelectedQuoteId: (id: string | null) => void;
  clearGeneratedQuote: () => void;
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set) => ({
      // Initial state
      generatedQuote: null,
      selectedQuoteId: null,
      
      // Actions
      setGeneratedQuote: (quote) => set({ generatedQuote: quote }),
      setSelectedQuoteId: (id) => set({ selectedQuoteId: id }),
      clearGeneratedQuote: () => set({ generatedQuote: null }),
    }),
    {
      name: 'quote-storage',
      partialize: (state) => ({
        generatedQuote: state.generatedQuote,
        selectedQuoteId: state.selectedQuoteId,
      }),
    }
  )
);

