import React, { useState, useEffect } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import type { TemplateTab } from '@/types/templates';
import PaymentMethodSection from '../prebuilt-templates/PaymentMethodSection';
import QuoteFormatSection from '../prebuilt-templates/QuoteFormatSection';
import PDFExportSection from '../prebuilt-templates/PDFExportSection';
import TemplatePreviewCanvas from '../prebuilt-templates/TemplatePreviewCanvas';

interface ExportSettingsSectionProps {
  onNavigate?: (view: string) => void;
}

const ExportSettingsSection: React.FC<ExportSettingsSectionProps> = ({ onNavigate }) => {
  const { activeTab, setActiveTab, hasUnsavedChanges, setHasUnsavedChanges, saveTemplates, loadTemplates, isSaving } = useTemplateStore();
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingTab, setPendingTab] = useState<TemplateTab | null>(null);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isFullPage, setIsFullPage] = useState(false);

  useEffect(() => {
    useTemplateStore.getState().loadTemplates();
  }, []);

  const handleTabChange = (tab: TemplateTab) => {
    if (tab === 'materialPrices') return;
    if (hasUnsavedChanges) {
      setPendingTab(tab);
      setShowUnsavedWarning(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleSaveAndSwitchTab = async () => {
    await saveTemplates();
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
    setShowUnsavedWarning(false);
  };

  const handleDiscardAndSwitchTab = async () => {
    setIsDiscarding(true);
    try {
      await loadTemplates();
    } finally {
      setHasUnsavedChanges(false);
      if (pendingTab) {
        setActiveTab(pendingTab);
        setPendingTab(null);
      }
      setShowUnsavedWarning(false);
      setIsDiscarding(false);
    }
  };

  const handleCancelTabChange = () => {
    setPendingTab(null);
    setShowUnsavedWarning(false);
  };

  const handleSave = async () => {
    await saveTemplates();
  };

  const tabs: Array<{ id: TemplateTab; label: string; comingSoon?: boolean }> = [
    { id: 'quoteFormat', label: 'Quote Format' },
    { id: 'paymentMethod', label: 'Payment Method' },
    { id: 'pdfExport', label: 'PDF Export' },
    { id: 'materialPrices', label: 'Material Prices', comingSoon: true },
  ];

  const content = (
    <>
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="border-b border-gray-200 bg-white flex-shrink-0">
            <div className="px-4 sm:px-6">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => {
                  const isDisabled = tab.comingSoon === true;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => !isDisabled && handleTabChange(tab.id)}
                      disabled={isDisabled}
                      className={`px-4 sm:px-6 py-4 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
                        isDisabled ? 'text-gray-400 cursor-not-allowed' : activeTab === tab.id ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                      {tab.comingSoon && (
                        <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">Coming soon</span>
                      )}
                      {activeTab === tab.id && !isDisabled && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <p className="text-4xl text-gray-300 mb-4">📋</p>
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">Material Prices Library</h2>
                  <p className="text-gray-500">Coming soon</p>
                  <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                    Manage custom prices for material lists. Add, edit, or import material prices to use in your projects.
                  </p>
                </div>
              )}
            </div>
          </div>

          {hasUnsavedChanges && (
            <div className="border-t border-gray-200 bg-white px-4 sm:px-6 py-4 flex-shrink-0">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <p className="text-sm text-gray-600">You have unsaved changes</p>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`px-6 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    isSaving ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        {(activeTab === 'quoteFormat' || activeTab === 'pdfExport') && (
          <div className="hidden lg:flex lg:w-[340px] xl:w-[380px] flex-shrink-0 border-l border-gray-200 bg-gray-50 p-4 overflow-hidden">
            <div className="w-full h-full min-h-[320px]">
              <TemplatePreviewCanvas />
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white font-sans text-gray-800">
      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unsaved Changes</h3>
            <p className="text-sm text-gray-600 mb-4">
              You have unsaved changes. Do you want to save them before switching tabs?
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <button onClick={handleCancelTabChange} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={handleSaveAndSwitchTab} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800">
                Save & Continue
              </button>
              <button
                onClick={handleDiscardAndSwitchTab}
                disabled={isDiscarding}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {isDiscarding ? 'Discarding...' : 'Discard Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-page overlay: full viewport for focused editing */}
      {isFullPage ? (
        <div
          className="fixed inset-0 z-[100] bg-white flex flex-col font-sans text-gray-800"
          role="dialog"
          aria-modal="true"
          aria-label="Export settings (full page)"
        >
          {/* Sticky header with Back button */}
          <header className="flex-shrink-0 flex items-center gap-4 px-4 sm:px-6 py-3 border-b border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setIsFullPage(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded-lg px-2 py-1.5 -ml-2"
              aria-label="Back to Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm sm:text-base">Back to Settings</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 truncate">Export settings</h1>
          </header>
          {/* Full-page content: uses remaining height */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {content}
          </div>
        </div>
      ) : (
        <>
          {/* Inline toolbar: Full page button */}
          <div className="flex-shrink-0 flex items-center justify-between gap-2 px-4 sm:px-6 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-500">Expand for a larger editing view</span>
            <button
              type="button"
              onClick={() => setIsFullPage(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
              aria-label="Open full page view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Full page
            </button>
          </div>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {content}
          </div>
        </>
      )}
    </div>
  );
};

export default ExportSettingsSection;
