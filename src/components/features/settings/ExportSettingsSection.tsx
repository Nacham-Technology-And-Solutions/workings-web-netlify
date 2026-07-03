import React, { useState, useEffect } from 'react';
import PaymentMethodSection from '../prebuilt-templates/PaymentMethodSection';
import QuoteFormatSection from '../prebuilt-templates/QuoteFormatSection';
import PDFExportSection from '../prebuilt-templates/PDFExportSection';
import MaterialPricesSection from '../prebuilt-templates/MaterialPricesSection';
import TemplatePreviewCanvas from '../prebuilt-templates/TemplatePreviewCanvas';
import ActionToast from '@/components/common/ActionToast';
import { useTemplateStore } from '@/stores/templateStore';
import type { TemplateTab } from '@/types/templates';
import { consumeExportSettingsNotice } from '@/utils/settingsNavigation';

interface ExportSettingsSectionProps {
  onNavigate?: (view: string) => void;
}

const ExportSettingsSection: React.FC<ExportSettingsSectionProps> = ({ onNavigate }) => {
  const { activeTab, setActiveTab, hasUnsavedChanges, setHasUnsavedChanges, saveTemplates, loadTemplates, isSaving } = useTemplateStore();
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingTab, setPendingTab] = useState<TemplateTab | null>(null);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isFullPage, setIsFullPage] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    useTemplateStore.getState().loadTemplates();
    const notice = consumeExportSettingsNotice();
    if (notice) {
      setToast(notice);
    }
  }, []);

  const handleSave = async () => {
    const saved = await saveTemplates();
    if (saved) {
      setSaveMessage({ type: 'success', text: 'Export settings saved successfully.' });
    } else {
      setSaveMessage({
        type: 'error',
        text: 'Could not save to the server. Changes are kept locally — try again.',
      });
    }
  };

  const handleTabChange = (tab: TemplateTab) => {
    if (hasUnsavedChanges) {
      setPendingTab(tab);
      setShowUnsavedWarning(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleSaveAndSwitchTab = async () => {
    await handleSave();
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

  const tabs: Array<{ id: TemplateTab; label: string; comingSoon?: boolean }> = [
    { id: 'quoteFormat', label: 'Quote Format' },
    { id: 'paymentMethod', label: 'Payment Method' },
    { id: 'pdfExport', label: 'PDF Export' },
    { id: 'materialPrices', label: 'Material Prices' },
  ];

  const showPreviewPanel = activeTab === 'quoteFormat' || activeTab === 'pdfExport';

  const previewBlock = showPreviewPanel ? (
    <div className="w-full min-h-[280px]">
      <TemplatePreviewCanvas />
    </div>
  ) : null;

  const content = (
    <>
      {saveMessage && (
        <div
          className={`mx-4 sm:mx-6 mt-4 rounded-lg border px-4 py-3 text-sm flex items-start justify-between gap-3 ${
            saveMessage.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <p>{saveMessage.text}</p>
          <button type="button" onClick={() => setSaveMessage(null)} className="font-medium flex-shrink-0">
            Dismiss
          </button>
        </div>
      )}

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

          {showPreviewPanel && (
            <div className="lg:hidden border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowMobilePreview((prev) => !prev)}
                className="w-full px-4 py-3 text-sm font-medium text-gray-700 flex items-center justify-between"
              >
                <span>{showMobilePreview ? 'Hide preview' : 'Show live preview'}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showMobilePreview ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showMobilePreview && <div className="px-4 pb-4">{previewBlock}</div>}
            </div>
          )}

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
                    Quote templates can list multiple bank accounts. Your Profile bank details are also offered when creating quotes.
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
                    Manage unit prices for the estimation engine. Each row needs an item key so prices auto-fill when you select <strong>My prices</strong> on a calculated project.
                  </p>
                  <MaterialPricesSection />
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
                  className={`px-6 py-2 text-sm font-semibold rounded transition-colors ${
                    isSaving ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        {showPreviewPanel && (
          <div className="hidden lg:flex lg:w-[340px] xl:w-[380px] flex-shrink-0 border-l border-gray-200 bg-gray-50 p-4 overflow-hidden">
            <div className="w-full h-full min-h-[320px]">{previewBlock}</div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white font-sans text-gray-800">
      {toast && (
        <ActionToast
          type={toast.type}
          message={toast.text}
          onDismiss={() => setToast(null)}
        />
      )}

      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unsaved Changes</h3>
            <p className="text-sm text-gray-600 mb-4">
              You have unsaved changes. Do you want to save them before switching tabs?
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <button onClick={handleCancelTabChange} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={handleSaveAndSwitchTab} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-800">
                Save & Continue
              </button>
              <button
                onClick={handleDiscardAndSwitchTab}
                disabled={isDiscarding}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {isDiscarding ? 'Discarding...' : 'Discard Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isFullPage ? (
        <div
          className="fixed inset-0 z-[100] bg-white flex flex-col font-sans text-gray-800"
          role="dialog"
          aria-modal="true"
          aria-label="Export settings (full page)"
        >
          <header className="flex-shrink-0 flex items-center gap-4 px-4 sm:px-6 py-3 border-b border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setIsFullPage(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded px-2 py-1.5 -ml-2"
              aria-label="Back to Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm sm:text-base">Back to Settings</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 truncate">Export settings</h1>
          </header>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{content}</div>
        </div>
      ) : (
        <>
          <div className="flex-shrink-0 flex items-center justify-between gap-2 px-4 sm:px-6 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-500">Expand for a larger editing view</span>
            <div className="flex items-center gap-2">
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('templates')}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50"
                >
                  Templates
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFullPage(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:border-gray-300 transition-colors"
                aria-label="Open full page view"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Full page
              </button>
            </div>
          </div>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{content}</div>
        </>
      )}
    </div>
  );
};

export default ExportSettingsSection;
