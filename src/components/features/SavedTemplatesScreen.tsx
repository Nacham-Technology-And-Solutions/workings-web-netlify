import React, { useState } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import type { SavedTemplateType } from '@/types/templates';
import { DocumentIcon, TrashIcon } from '@/assets/icons/IconComponents';

interface SavedTemplatesScreenProps {
  onBack: () => void;
  onNavigate: (view: string) => void;
}

const typeLabels: Record<SavedTemplateType, string> = {
  quoteFormat: 'Quote Format',
  pdfExport: 'PDF Export',
  full: 'Quote + PDF',
};

const SavedTemplatesScreen: React.FC<SavedTemplatesScreenProps> = ({ onBack, onNavigate }) => {
  const { savedTemplates, addSavedTemplate, removeSavedTemplate, applySavedTemplate } = useTemplateStore();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveType, setSaveType] = useState<SavedTemplateType>('full');

  const handleApply = (id: string) => {
    applySavedTemplate(id);
    onNavigate('exportSettings');
  };

  const handleSaveCurrent = () => {
    const name = saveName.trim();
    if (!name) return;
    addSavedTemplate(name, saveType);
    setSaveName('');
    setSaveType('full');
    setShowSaveModal(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Remove this saved template?')) {
      removeSavedTemplate(id);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white font-sans text-gray-800 overflow-y-auto">
      <div className="px-4 sm:px-8 py-6 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={onBack} className="text-gray-600 hover:text-gray-900" aria-label="Back">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Saved Templates</h1>
              <p className="text-sm text-gray-600 mt-1">
                Apply a template with one click to change your export settings (Quote Format &amp; PDF Export).
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600">
              {savedTemplates.length === 0
                ? 'No saved templates yet. Save your current export settings as a template to reuse later.'
                : `${savedTemplates.length} saved template${savedTemplates.length === 1 ? '' : 's'}`}
            </p>
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              <DocumentIcon className="w-4 h-4" />
              Save current as template
            </button>
          </div>

          {savedTemplates.length === 0 ? (
            <div className="bg-gray-50 rounded-xl border border-gray-200 border-dashed p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                <DocumentIcon className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-600 font-medium mb-1">No saved templates</p>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Configure Quote Format and PDF Export in Settings → Export settings, then save your setup as a template here.
              </p>
              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Save current settings as template
              </button>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedTemplates.map((template) => (
                <li
                  key={template.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-gray-900 truncate flex-1">{template.name}</h3>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(template.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 flex-shrink-0"
                      aria-label="Delete template"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
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

      {/* Save current as template modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save current settings as template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template name</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. Standard Quote"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What to save</label>
                <div className="space-y-2">
                  {(['full', 'quoteFormat', 'pdfExport'] as const).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="saveType"
                        checked={saveType === type}
                        onChange={() => setSaveType(type)}
                        className="w-4 h-4 text-gray-800 border-gray-300 focus:ring-gray-800"
                      />
                      <span className="text-sm text-gray-700">{typeLabels[type]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveName('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCurrent}
                disabled={!saveName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedTemplatesScreen;
