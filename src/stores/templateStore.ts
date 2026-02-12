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
  SavedTemplate,
  SavedTemplateType,
} from '@/types/templates';
import { templatesService } from '@/services/api/templates.service';

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
  addPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>) => Promise<void>;
  updatePaymentMethod: (id: string, method: Partial<PaymentMethod>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
  updatePaymentMethodConfig: (config: Partial<PaymentMethodConfig>) => void;
  getDefaultPaymentMethod: () => PaymentMethod | null;
  
  // PDF Export Actions
  updatePDFExport: (config: Partial<PDFExportConfig>) => void;
  resetPDFExport: () => void;
  
  // Material Prices Actions
  addMaterialPrice: (price: Omit<MaterialPrice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMaterialPrice: (id: string, price: Partial<MaterialPrice>) => Promise<void>;
  deleteMaterialPrice: (id: string) => Promise<void>;
  importMaterialPrices: (prices: MaterialPrice[]) => void;
  updateMaterialPricesConfig: (config: Partial<MaterialPricesConfig>) => void;
  
  // General Actions
  loadTemplates: () => Promise<void>;
  saveTemplates: () => Promise<void>;
  resetToDefaults: () => void;

  // Saved Templates (user-created presets) - synced with backend /api/v1/saved-templates
  savedTemplates: SavedTemplate[];
  fetchSavedTemplates: () => Promise<void>;
  addSavedTemplate: (name: string, type: SavedTemplateType) => Promise<{ success: true } | { success: false; message: string }>;
  removeSavedTemplate: (id: string) => Promise<{ success: boolean; message?: string }>;
  applySavedTemplate: (id: string) => void;

  // Pre-built templates (app defaults; read-only list)
  getPrebuiltTemplates: () => SavedTemplate[];
  applyPrebuiltTemplate: (id: string) => void;
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

/** App-provided preset templates (same shape as SavedTemplate, source: system). Not persisted. */
const PREBUILT_TEMPLATES: SavedTemplate[] = [
  {
    id: 'prebuilt_standard',
    name: 'Standard',
    type: 'full',
    quoteFormat: JSON.parse(JSON.stringify(defaultQuoteFormat)),
    pdfExport: JSON.parse(JSON.stringify(defaultPDFExport)),
    createdAt: '',
    source: 'system',
  },
  {
    id: 'prebuilt_minimal',
    name: 'Minimal',
    type: 'full',
    quoteFormat: JSON.parse(JSON.stringify({
      ...defaultQuoteFormat,
      typography: { ...defaultQuoteFormat.typography, bodySize: 11 },
      page: { ...defaultQuoteFormat.page, sectionSpacing: 10 },
    })),
    pdfExport: JSON.parse(JSON.stringify(defaultPDFExport)),
    createdAt: '',
    source: 'system',
  },
];

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
      savedTemplates: [],

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
      addPaymentMethod: async (method) => {
        try {
          // Try to create via API first
          const createdMethod = await templatesService.createPaymentMethod(method);
          
          if (createdMethod) {
            // API success - use the created method from backend
            set((state) => ({
              paymentMethods: [...state.paymentMethods, createdMethod],
              paymentMethodConfig: {
                ...state.paymentMethodConfig,
                methods: [...state.paymentMethodConfig.methods, createdMethod],
              },
              hasUnsavedChanges: false, // Saved to API
            }));
          } else {
            // API failed - fallback to local state
            const newMethod: PaymentMethod = {
              ...method,
              id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              isDefault: get().paymentMethods.length === 0,
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
          }
        } catch (error) {
          console.error('[TemplateStore] Error adding payment method:', error);
          // Fallback to local state on error
          const newMethod: PaymentMethod = {
            ...method,
            id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isDefault: get().paymentMethods.length === 0,
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
        }
      },
      updatePaymentMethod: async (id, method) => {
        try {
          // Try to update via API first
          const updatedMethod = await templatesService.updatePaymentMethod(id, method);
          
          if (updatedMethod) {
            // API success - use the updated method from backend
            set((state) => {
              const updatedMethods = state.paymentMethods.map((pm) =>
                pm.id === id ? updatedMethod : pm
              );
              return {
                paymentMethods: updatedMethods,
                paymentMethodConfig: {
                  ...state.paymentMethodConfig,
                  methods: updatedMethods,
                },
                hasUnsavedChanges: false, // Saved to API
              };
            });
          } else {
            // API failed - fallback to local state
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
          }
        } catch (error) {
          console.error('[TemplateStore] Error updating payment method:', error);
          // Fallback to local state on error
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
        }
      },
      deletePaymentMethod: async (id) => {
        try {
          // Try to delete via API first
          const deleted = await templatesService.deletePaymentMethod(id);
          
          if (deleted) {
            // API success - remove from state
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
                hasUnsavedChanges: false, // Saved to API
              };
            });
          } else {
            // API failed - fallback to local state
            set((state) => {
              const filtered = state.paymentMethods.filter((pm) => pm.id !== id);
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
          }
        } catch (error) {
          console.error('[TemplateStore] Error deleting payment method:', error);
          // Fallback to local state on error
          set((state) => {
            const filtered = state.paymentMethods.filter((pm) => pm.id !== id);
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
        }
      },
      setDefaultPaymentMethod: async (id) => {
        try {
          // Update via API
          const updatedMethod = await templatesService.updatePaymentMethod(id, { isDefault: true });
          
          if (updatedMethod) {
            // API success - update all methods
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
                hasUnsavedChanges: false, // Saved to API
              };
            });
          } else {
            // API failed - fallback to local state
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
          }
        } catch (error) {
          console.error('[TemplateStore] Error setting default payment method:', error);
          // Fallback to local state on error
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
        }
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
      addMaterialPrice: async (price) => {
        try {
          // Try to create via API first
          const createdPrice = await templatesService.createMaterialPrice(price);
          
          if (createdPrice) {
            // API success - use the created price from backend
            set((state) => ({
              materialPrices: [...state.materialPrices, createdPrice],
              materialPricesConfig: {
                ...state.materialPricesConfig,
                prices: [...state.materialPricesConfig.prices, createdPrice],
              },
              hasUnsavedChanges: false, // Saved to API
            }));
          } else {
            // API failed - fallback to local state
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
          }
        } catch (error) {
          console.error('[TemplateStore] Error adding material price:', error);
          // Fallback to local state on error
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
        }
      },
      updateMaterialPrice: async (id, price) => {
        try {
          // Try to update via API first
          const updatedPrice = await templatesService.updateMaterialPrice(id, price);
          
          if (updatedPrice) {
            // API success - use the updated price from backend
            set((state) => {
              const updatedPrices = state.materialPrices.map((mp) =>
                mp.id === id ? updatedPrice : mp
              );
              return {
                materialPrices: updatedPrices,
                materialPricesConfig: {
                  ...state.materialPricesConfig,
                  prices: updatedPrices,
                },
                hasUnsavedChanges: false, // Saved to API
              };
            });
          } else {
            // API failed - fallback to local state
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
          }
        } catch (error) {
          console.error('[TemplateStore] Error updating material price:', error);
          // Fallback to local state on error
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
        }
      },
      deleteMaterialPrice: async (id) => {
        try {
          // Try to delete via API first
          const deleted = await templatesService.deleteMaterialPrice(id);
          
          if (deleted) {
            // API success - remove from state
            set((state) => {
              const filtered = state.materialPrices.filter((mp) => mp.id !== id);
              return {
                materialPrices: filtered,
                materialPricesConfig: {
                  ...state.materialPricesConfig,
                  prices: filtered,
                },
                hasUnsavedChanges: false, // Saved to API
              };
            });
          } else {
            // API failed - fallback to local state
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
          }
        } catch (error) {
          console.error('[TemplateStore] Error deleting material price:', error);
          // Fallback to local state on error
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
        }
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
          // Try to load from API first
          const apiData = await templatesService.getTemplates();
          
          if (apiData) {
            // API success - use data from backend
            set({
              quoteFormat: apiData.quoteFormat || defaultQuoteFormat,
              paymentMethods: apiData.paymentMethods || [],
              paymentMethodConfig: apiData.paymentMethodConfig || {
                methods: apiData.paymentMethods || [],
                displayOptions: {
                  showInPreview: true,
                  showInPDF: true,
                },
              },
              pdfExport: apiData.pdfExport || defaultPDFExport,
              materialPrices: apiData.materialPrices || [],
              materialPricesConfig: apiData.materialPricesConfig || {
                prices: apiData.materialPrices || [],
                defaultMarkup: 0,
                categoryMarkups: {},
              },
              hasUnsavedChanges: false,
              isLoading: false,
            });
          } else {
            // API failed - data will be loaded from localStorage by persist middleware
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('[TemplateStore] Error loading templates:', error);
          // Data will be loaded from localStorage by persist middleware
          set({ isLoading: false });
        }
      },
      saveTemplates: async () => {
        set({ isSaving: true });
        try {
          const state = get();
          
          // Prepare template config for API
          const templateConfig = {
            quoteFormat: state.quoteFormat,
            paymentMethods: state.paymentMethods,
            paymentMethodConfig: state.paymentMethodConfig,
            pdfExport: state.pdfExport,
            materialPrices: state.materialPrices,
            materialPricesConfig: state.materialPricesConfig,
          };
          
          // Try to save to API
          const saved = await templatesService.saveTemplates(templateConfig);
          
          if (saved) {
            // API success
            set({ isSaving: false, hasUnsavedChanges: false });
          } else {
            // API failed - data will be saved to localStorage by persist middleware
            set({ isSaving: false, hasUnsavedChanges: false });
          }
        } catch (error) {
          console.error('[TemplateStore] Error saving templates:', error);
          // Data will be saved to localStorage by persist middleware
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

      // Saved Templates (user-created) - consume backend /api/v1/saved-templates
      fetchSavedTemplates: async () => {
        try {
          const list = await templatesService.getSavedTemplates();
          set({ savedTemplates: list });
        } catch (error: any) {
          console.warn('[TemplateStore] Failed to fetch saved templates:', error?.message);
          // Keep existing state (e.g. from persist) on failure
        }
      },
      addSavedTemplate: async (name, type) => {
        const state = get();
        const payload: { name: string; type: SavedTemplateType; quoteFormat?: QuoteFormatConfig; pdfExport?: PDFExportConfig } = {
          name: name.trim(),
          type,
        };
        if (type === 'quoteFormat' || type === 'full') payload.quoteFormat = state.quoteFormat;
        if (type === 'pdfExport' || type === 'full') payload.pdfExport = state.pdfExport;
        try {
          const created = await templatesService.createSavedTemplate(payload);
          set({ savedTemplates: [...state.savedTemplates.filter((t) => t.source !== 'system'), created] });
          return { success: true as const };
        } catch (error: any) {
          const message =
            error?.response?.data?.message ||
            error?.response?.data?.responseMessage ||
            error?.message ||
            'Failed to save template';
          return { success: false, message };
        }
      },
      removeSavedTemplate: async (id) => {
        try {
          await templatesService.deleteSavedTemplate(id);
          set((state) => ({
            savedTemplates: state.savedTemplates.filter((t) => t.id !== id),
          }));
          return { success: true };
        } catch (error: any) {
          const message =
            error?.response?.data?.message ||
            error?.response?.data?.responseMessage ||
            error?.message ||
            'Failed to delete template';
          return { success: false, message };
        }
      },
      applySavedTemplate: (id) => {
        const state = get();
        const template = state.savedTemplates.find((t) => t.id === id);
        if (!template) return;
        const updates: Partial<typeof state> = { hasUnsavedChanges: true };
        if (template.quoteFormat) updates.quoteFormat = template.quoteFormat;
        if (template.pdfExport) updates.pdfExport = template.pdfExport;
        set(updates);
      },

      getPrebuiltTemplates: () => PREBUILT_TEMPLATES,
      applyPrebuiltTemplate: (id) => {
        const template = PREBUILT_TEMPLATES.find((t) => t.id === id);
        if (!template) return;
        set((state) => ({
          quoteFormat: template.quoteFormat ?? state.quoteFormat,
          pdfExport: template.pdfExport ?? state.pdfExport,
          hasUnsavedChanges: true,
        }));
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
        savedTemplates: state.savedTemplates,
      }),
    }
  )
);

