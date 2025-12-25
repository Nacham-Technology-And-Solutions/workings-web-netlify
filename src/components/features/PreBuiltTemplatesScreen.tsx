import React, { useState, useEffect } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import type { TemplateTab } from '@/types/templates';
import PaymentMethodSection from './prebuilt-templates/PaymentMethodSection';
import QuoteFormatSection from './prebuilt-templates/QuoteFormatSection';
import PDFExportSection from './prebuilt-templates/PDFExportSection';
import MaterialPricesSection from './prebuilt-templates/MaterialPricesSection';

interface PreBuiltTemplatesScreenProps {
  onBack: () => void;
}

const PreBuiltTemplatesScreen: React.FC<PreBuiltTemplatesScreenProps> = ({ onBack }) => {
  const { activeTab, setActiveTab, hasUnsavedChanges, saveTemplates, isSaving } = useTemplateStore();
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingTab, setPendingTab] = useState<TemplateTab | null>(null);

  useEffect(() => {
    // Load templates on mount
    useTemplateStore.getState().loadTemplates();
  }, []);

  const handleTabChange = (tab: TemplateTab) => {
    if (hasUnsavedChanges) {
      setPendingTab(tab);
      setShowUnsavedWarning(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleConfirmTabChange = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
    setShowUnsavedWarning(false);
  };

  const handleCancelTabChange = () => {
    setPendingTab(null);
    setShowUnsavedWarning(false);
  };

  const handleSave = async () => {
    await saveTemplates();
    // Show success message (can add toast notification here)
  };

  const tabs: Array<{ id: TemplateTab; label: string }> = [
    { id: 'quoteFormat', label: 'Quote Format' },
    { id: 'paymentMethod', label: 'Payment Method' },
    { id: 'pdfExport', label: 'PDF Export' },
    { id: 'materialPrices', label: 'Material Prices' },
  ];

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pre-Built Templates</h1>
              <p className="text-sm text-gray-600 mt-1">
                Configure quote formats, payment methods, PDF export settings, and material prices
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unsaved Changes</h3>
            <p className="text-sm text-gray-600 mb-4">
              You have unsaved changes. Do you want to save them before switching tabs?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelTabChange}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
              >
                Save & Continue
              </button>
              <button
                onClick={handleConfirmTabChange}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-8 py-8">
            {activeTab === 'quoteFormat' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quote Format Configuration</h2>
                <p className="text-gray-600 mb-6">
                  Customize the appearance and layout of your quotes. Configure headers, footers, colors, typography, and section visibility.
                </p>
                <QuoteFormatSection />
              </div>
            )}

            {activeTab === 'paymentMethod' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method Configuration</h2>
                <p className="text-gray-600 mb-6">
                  Manage default payment methods for quotes. Add, edit, or delete payment methods and set display options.
                </p>
                <PaymentMethodSection />
              </div>
            )}

            {activeTab === 'pdfExport' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">PDF Export Format Configuration</h2>
                <p className="text-gray-600 mb-6">
                  Configure PDF export settings for quotes and material lists. Set page size, orientation, fonts, and file naming patterns.
                </p>
                <PDFExportSection />
              </div>
            )}

            {activeTab === 'materialPrices' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Material Prices Library</h2>
                <p className="text-gray-600 mb-6">
                  Manage custom prices for material lists. Add, edit, or import material prices to use in your projects.
                </p>
                <MaterialPricesSection />
              </div>
            )}
          </div>
        </div>

        {/* Footer with Save Button */}
        {hasUnsavedChanges && (
          <div className="border-t border-gray-200 bg-white px-8 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <p className="text-sm text-gray-600">You have unsaved changes</p>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-6 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  isSaving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreBuiltTemplatesScreen;

