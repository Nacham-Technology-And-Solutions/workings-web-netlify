/**
 * Zustand store for Pre-Built Templates configuration
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  QuoteFormatConfig,
  PaymentMethod,
  PaymentMethodConfig,
  PDFExportConfig,
  MaterialPrice,
  MaterialPricesConfig,
  TemplateTab,
} from '@/types/templates';

interface TemplateState {
  // Quote Format
  quoteFormat: QuoteFormatConfig;
  
  // Payment Methods
  paymentMethods: PaymentMethod[];
  paymentMethodConfig: PaymentMethodConfig;
  
  // PDF Export
  pdfExport: PDFExportConfig;
  
  // Material Prices
  materialPrices: MaterialPrice[];
  materialPricesConfig: MaterialPricesConfig;
  
  // UI State
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  activeTab: TemplateTab;
  
  // Actions
  setActiveTab: (tab: TemplateTab) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  
  // Quote Format Actions
  updateQuoteFormat: (config: Partial<QuoteFormatConfig>) => void;
  resetQuoteFormat: () => void;
  
  // Payment Method Actions
  addPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>) => void;
  updatePaymentMethod: (id: string, method: Partial<PaymentMethod>) => void;
  deletePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
  updatePaymentMethodConfig: (config: Partial<PaymentMethodConfig>) => void;
  getDefaultPaymentMethod: () => PaymentMethod | null;
  
  // PDF Export Actions
  updatePDFExport: (config: Partial<PDFExportConfig>) => void;
  resetPDFExport: () => void;
  
  // Material Prices Actions
  addMaterialPrice: (price: Omit<MaterialPrice, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMaterialPrice: (id: string, price: Partial<MaterialPrice>) => void;
  deleteMaterialPrice: (id: string) => void;
  importMaterialPrices: (prices: MaterialPrice[]) => void;
  updateMaterialPricesConfig: (config: Partial<MaterialPricesConfig>) => void;
  
  // General Actions
  loadTemplates: () => Promise<void>;
  saveTemplates: () => Promise<void>;
  resetToDefaults: () => void;
}

// Default values
const defaultQuoteFormat: QuoteFormatConfig = {
  header: {
    companyName: '',
    tagline: '',
    alignment: 'left',
  },
  footer: {
    content: '',
    alignment: 'center',
    visible: true,
  },
  colors: {
    primary: '#1F2937',
    secondary: '#6B7280',
    accent: '#3B82F6',
  },
  typography: {
    fontFamily: 'Arial',
    headingSize: 18,
    bodySize: 12,
  },
  page: {
    orientation: 'portrait',
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
    sectionSpacing: 15,
  },
  sections: {
    projectInfo: { visible: true, order: 1 },
    customerDetails: { visible: true, order: 2 },
    itemsTable: { visible: true, order: 3 },
    summary: { visible: true, order: 4 },
    paymentInfo: { visible: true, order: 5 },
    notes: { visible: true, order: 6 },
  },
};

const defaultPDFExport: PDFExportConfig = {
  quote: {
    pageSize: 'A4',
    orientation: 'portrait',
    header: { enabled: true, height: 30 },
    footer: { enabled: true, height: 20 },
    logo: { enabled: false, size: 'medium', position: 'top-left' },
    fonts: {
      family: 'Helvetica',
      headingSize: 16,
      bodySize: 10,
      tableSize: 9,
      headingColor: '#000000',
      bodyColor: '#000000',
    },
  },
  materialList: {
    pageSize: 'A4',
    orientation: 'portrait',
    includeCuttingList: true,
    cuttingListFormat: 'table',
    includeGlassList: true,
  },
  fileNaming: {
    pattern: 'Quote-{quoteId}-{projectName}',
    dateFormat: 'YYYY-MM-DD',
  },
};

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      // Initial state
      quoteFormat: defaultQuoteFormat,
      paymentMethods: [],
      paymentMethodConfig: {
        methods: [],
        displayOptions: {
          showInPreview: true,
          showInPDF: true,
        },
      },
      pdfExport: defaultPDFExport,
      materialPrices: [],
      materialPricesConfig: {
        prices: [],
        defaultMarkup: 0,
        categoryMarkups: {},
      },
      isLoading: false,
      isSaving: false,
      hasUnsavedChanges: false,
      activeTab: 'quoteFormat',
      
      // UI Actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
      
      // Quote Format Actions
      updateQuoteFormat: (config) => {
        set((state) => ({
          quoteFormat: { ...state.quoteFormat, ...config },
          hasUnsavedChanges: true,
        }));
      },
      resetQuoteFormat: () => {
        set({ quoteFormat: defaultQuoteFormat, hasUnsavedChanges: true });
      },
      
      // Payment Method Actions
      addPaymentMethod: (method) => {
        const newMethod: PaymentMethod = {
          ...method,
          id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          isDefault: get().paymentMethods.length === 0, // First one is default
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          paymentMethods: [...state.paymentMethods, newMethod],
          paymentMethodConfig: {
            ...state.paymentMethodConfig,
            methods: [...state.paymentMethodConfig.methods, newMethod],
          },
          hasUnsavedChanges: true,
        }));
      },
      updatePaymentMethod: (id, method) => {
        set((state) => {
          const updatedMethods = state.paymentMethods.map((pm) =>
            pm.id === id ? { ...pm, ...method, updatedAt: new Date().toISOString() } : pm
          );
          return {
            paymentMethods: updatedMethods,
            paymentMethodConfig: {
              ...state.paymentMethodConfig,
              methods: updatedMethods,
            },
            hasUnsavedChanges: true,
          };
        });
      },
      deletePaymentMethod: (id) => {
        set((state) => {
          const filtered = state.paymentMethods.filter((pm) => pm.id !== id);
          // If deleted was default, make first one default
          const deletedWasDefault = state.paymentMethods.find((pm) => pm.id === id)?.isDefault;
          const updatedMethods = deletedWasDefault && filtered.length > 0
            ? filtered.map((pm, index) => ({ ...pm, isDefault: index === 0 }))
            : filtered;
          return {
            paymentMethods: updatedMethods,
            paymentMethodConfig: {
              ...state.paymentMethodConfig,
              methods: updatedMethods,
            },
            hasUnsavedChanges: true,
          };
        });
      },
      setDefaultPaymentMethod: (id) => {
        set((state) => {
          const updatedMethods = state.paymentMethods.map((pm) => ({
            ...pm,
            isDefault: pm.id === id,
          }));
          return {
            paymentMethods: updatedMethods,
            paymentMethodConfig: {
              ...state.paymentMethodConfig,
              methods: updatedMethods,
            },
            hasUnsavedChanges: true,
          };
        });
      },
      updatePaymentMethodConfig: (config) => {
        set((state) => ({
          paymentMethodConfig: { ...state.paymentMethodConfig, ...config },
          hasUnsavedChanges: true,
        }));
      },
      getDefaultPaymentMethod: () => {
        const state = get();
        return state.paymentMethods.find((pm) => pm.isDefault) || null;
      },
      
      // PDF Export Actions
      updatePDFExport: (config) => {
        set((state) => ({
          pdfExport: { ...state.pdfExport, ...config },
          hasUnsavedChanges: true,
        }));
      },
      resetPDFExport: () => {
        set({ pdfExport: defaultPDFExport, hasUnsavedChanges: true });
      },
      
      // Material Prices Actions
      addMaterialPrice: (price) => {
        const newPrice: MaterialPrice = {
          ...price,
          id: `mp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          materialPrices: [...state.materialPrices, newPrice],
          materialPricesConfig: {
            ...state.materialPricesConfig,
            prices: [...state.materialPricesConfig.prices, newPrice],
          },
          hasUnsavedChanges: true,
        }));
      },
      updateMaterialPrice: (id, price) => {
        set((state) => {
          const updatedPrices = state.materialPrices.map((mp) =>
            mp.id === id ? { ...mp, ...price, updatedAt: new Date().toISOString() } : mp
          );
          return {
            materialPrices: updatedPrices,
            materialPricesConfig: {
              ...state.materialPricesConfig,
              prices: updatedPrices,
            },
            hasUnsavedChanges: true,
          };
        });
      },
      deleteMaterialPrice: (id) => {
        set((state) => {
          const filtered = state.materialPrices.filter((mp) => mp.id !== id);
          return {
            materialPrices: filtered,
            materialPricesConfig: {
              ...state.materialPricesConfig,
              prices: filtered,
            },
            hasUnsavedChanges: true,
          };
        });
      },
      importMaterialPrices: (prices) => {
        set((state) => ({
          materialPrices: prices,
          materialPricesConfig: {
            ...state.materialPricesConfig,
            prices,
          },
          hasUnsavedChanges: true,
        }));
      },
      updateMaterialPricesConfig: (config) => {
        set((state) => ({
          materialPricesConfig: { ...state.materialPricesConfig, ...config },
          hasUnsavedChanges: true,
        }));
      },
      
      // General Actions
      loadTemplates: async () => {
        set({ isLoading: true });
        try {
          // Load from localStorage (handled by persist middleware)
          // In future, can load from API here
          set({ isLoading: false });
        } catch (error) {
          console.error('[TemplateStore] Error loading templates:', error);
          set({ isLoading: false });
        }
      },
      saveTemplates: async () => {
        set({ isSaving: true });
        try {
          // Save to localStorage (handled by persist middleware)
          // In future, can save to API here
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
          set({ isSaving: false, hasUnsavedChanges: false });
        } catch (error) {
          console.error('[TemplateStore] Error saving templates:', error);
          set({ isSaving: false });
        }
      },
      resetToDefaults: () => {
        set({
          quoteFormat: defaultQuoteFormat,
          paymentMethods: [],
          paymentMethodConfig: {
            methods: [],
            displayOptions: {
              showInPreview: true,
              showInPDF: true,
            },
          },
          pdfExport: defaultPDFExport,
          materialPrices: [],
          materialPricesConfig: {
            prices: [],
            defaultMarkup: 0,
            categoryMarkups: {},
          },
          hasUnsavedChanges: true,
        });
      },
    }),
    {
      name: 'template-storage',
      partialize: (state) => ({
        quoteFormat: state.quoteFormat,
        paymentMethods: state.paymentMethods,
        paymentMethodConfig: state.paymentMethodConfig,
        pdfExport: state.pdfExport,
        materialPrices: state.materialPrices,
        materialPricesConfig: state.materialPricesConfig,
      }),
    }
  )
);

