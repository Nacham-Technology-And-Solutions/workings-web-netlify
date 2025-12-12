import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalculationResult } from '@/types/calculations';

interface CalculationState {
  // Current calculation result
  calculationResult: CalculationResult | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCalculationResult: (result: CalculationResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCalculation: () => void;
}

export const useCalculationStore = create<CalculationState>()(
  persist(
    (set) => ({
      // Initial state
      calculationResult: null,
      isLoading: false,
      error: null,
      
      // Actions
      setCalculationResult: (result) => set({ calculationResult: result, error: null }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearCalculation: () => set({
        calculationResult: null,
        error: null,
        isLoading: false,
      }),
    }),
    {
      name: 'calculation-storage',
      partialize: (state) => ({
        calculationResult: state.calculationResult,
      }),
    }
  )
);

