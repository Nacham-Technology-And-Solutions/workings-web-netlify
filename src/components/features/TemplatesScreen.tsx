import React, { useState } from 'react';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';
import { useTemplateStore } from '@/stores/templateStore';
import type { SavedTemplateType } from '@/types/templates';
import SavedTemplatesScreen from './SavedTemplatesScreen';

type TemplatesTab = 'prebuilt' | 'saved';

interface TemplatesScreenProps {
  onBack: () => void;
  onNavigate: (view: string) => void;
}

const typeLabels: Record<SavedTemplateType, string> = {
  quoteFormat: 'Quote Format',
  pdfExport: 'PDF Export',
  full: 'Quote + PDF',
};

/** Pre-built tab: list of app default templates (apply only, no delete). */
const PreBuiltTemplatesTab: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { getPrebuiltTemplates, applyPrebuiltTemplate } = useTemplateStore();
  const prebuilt = getPrebuiltTemplates();

  const handleApply = (id: string) => {
    applyPrebuiltTemplate(id);
    onNavigate('exportSettings');
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-7xl lg:mx-auto px-6 lg:p-8 py-6">
        <p className="text-sm text-gray-600 mb-6">
          Apply an app default template to reset Quote Format and PDF Export to a preset. You can then tweak in Export settings.
        </p>
        {prebuilt.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-gray-200 border-dashed p-12 text-center">
            <p className="text-gray-600 font-medium">No pre-built templates available.</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prebuilt.map((template) => (
              <li
                key={template.id}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <h3 className="font-semibold text-gray-900 truncate mb-3">{template.name}</h3>
                <span className="inline-block text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700 mb-4 w-fit">
                  {typeLabels[template.type]}
                </span>
                <p className="text-xs text-gray-500 mb-4 flex-1">
                  {template.type === 'full' && 'Quote format + PDF export'}
                  {template.type === 'quoteFormat' && 'Quote layout, colors, typography'}
                  {template.type === 'pdfExport' && 'Page size, fonts, file naming'}
                </p>
                <button
                  type="button"
                  onClick={() => handleApply(template.id)}
                  className="w-full py-2 px-4 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Apply template
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const TemplatesScreen: React.FC<TemplatesScreenProps> = ({ onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<TemplatesTab>('prebuilt');

  return (
    <div className="flex flex-col flex-1 h-screen min-h-0 bg-white font-sans text-gray-800 overflow-hidden">
      {/* Header - aligned with Help & Tips padding */}
      <div className="p-4 lg:p-6 bg-white border-b border-gray-200 shrink-0">
        <div className="max-w-7xl lg:mx-auto">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 lg:hover:bg-gray-100 lg:p-2 lg:rounded-lg lg:transition-colors shrink-0"
                aria-label="Go back"
              >
                <ChevronLeftIcon />
              </button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Templates</h1>
                <p className="text-sm lg:text-base text-gray-600 mt-1">
                  Pre-built app defaults and your saved templates. Open Export settings to edit quote format and PDF export.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('exportSettings')}
              className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap shrink-0"
            >
              Export settings
            </button>
          </div>

          {/* Tabs: Pre-built Templates | Saved Templates */}
          <div className="mt-4 bg-gray-100 p-1 rounded-full inline-flex space-x-1">
            <button
              type="button"
              onClick={() => setActiveTab('prebuilt')}
              className={`px-6 py-2.5 rounded-full text-base font-semibold transition-colors duration-200 focus:outline-none ${
                activeTab === 'prebuilt' ? 'bg-gray-800 text-white' : 'text-gray-500'
              }`}
            >
              Pre-built Templates
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`px-6 py-2.5 rounded-full text-base font-semibold transition-colors duration-200 focus:outline-none ${
                activeTab === 'saved' ? 'bg-gray-800 text-white' : 'text-gray-500'
              }`}
            >
              Saved Templates
            </button>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeTab === 'prebuilt' && <PreBuiltTemplatesTab onNavigate={onNavigate} />}
        {activeTab === 'saved' && (
          <SavedTemplatesScreen onBack={onBack} onNavigate={onNavigate} embedded />
        )}
      </div>
    </div>
  );
};

export default TemplatesScreen;
