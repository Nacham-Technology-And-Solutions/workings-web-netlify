
import React, { useState, useRef, useEffect } from 'react';
import { formatNaira } from '@/utils/formatters';
import type { FullMaterialList } from '@/types';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';
import { exportFullMaterialListToPDF, exportMaterialListToExcel, shareData } from '@/services/export/exportService';

interface MaterialListPreviewScreenProps {
  list: FullMaterialList;
  onBack: () => void;
  onDuplicate?: () => void;
}

const formatNumber = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const MaterialListPreviewScreen: React.FC<MaterialListPreviewScreenProps> = ({ list, onBack, onDuplicate }) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getDayWithSuffix = (day: number) => {
    if (day > 3 && day < 21) return day + 'th';
    switch (day % 10) {
      case 1: return day + "st";
      case 2: return day + "nd";
      case 3: return day + "rd";
      default: return day + "th";
    }
  };

  const date = new Date(list.date);
  const day = date.getUTCDate();
  const month = date.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  const formattedDate = `${getDayWithSuffix(day)} ${month}, ${year}`;
  const isDraft = list.status === 'Draft';
  const isCompleted = list.status === 'Completed';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showSuccessMessage = (message: string) => {
    setActionMessage({ type: 'success', text: message });
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleDownloadPDF = () => {
    try {
      exportFullMaterialListToPDF(list.items, list.projectName, list.preparedBy, list.total, list.date);
      showSuccessMessage('Material list exported as PDF successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      setActionMessage({ type: 'error', text: 'Failed to export PDF. Please try again.' });
      setTimeout(() => setActionMessage(null), 3000);
    }
    setShowExportModal(false);
    setIsMenuOpen(false);
  };

  const handleExportOption = async (option: 'pdf' | 'excel' | 'share') => {
    setShowExportModal(false);
    setIsMenuOpen(false);

    try {
      if (option === 'pdf') {
        exportFullMaterialListToPDF(list.items, list.projectName, list.preparedBy, list.total, list.date);
        showSuccessMessage('Material list exported as PDF successfully!');
      } else if (option === 'excel') {
        const materials = list.items.map(item => ({
          id: item.id,
          name: item.description,
          quantity: item.quantity,
          unit: 'pcs',
          unitPrice: item.unitPrice,
          total: item.total,
        }));
        exportMaterialListToExcel(materials, list.projectName, list.preparedBy, list.total);
        showSuccessMessage('Material list exported to Excel successfully!');
      } else if (option === 'share') {
        const shareText = `Material List: ${list.projectName}\nTotal: ${formatNaira(list.total)}\nPrepared by: ${list.preparedBy}\nDate: ${formattedDate}`;
        const result = await shareData('material', { text: shareText }, list.projectName);
        showSuccessMessage(result?.success ? (result.message || 'Shared!') : (result?.message || 'Share failed'));
      }
    } catch (error) {
      console.error('Export error:', error);
      setActionMessage({ type: 'error', text: 'Failed to export. Please try again.' });
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white font-sans text-gray-800">
      {/* Action message toast */}
      {actionMessage && (
        <div
          className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            actionMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <p className="text-white font-medium text-center">{actionMessage.text}</p>
        </div>
      )}

      {/* Main Content - Layout matching MaterialListDetailScreen (image 2) */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs - hidden on mobile */}
          <div className="hidden md:block">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span className="cursor-pointer hover:text-gray-900" onClick={onBack}>Material List</span>
            <span>/</span>
            <span>Create Material List</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Preview</span>
          </div>
          </div>

          {/* Page Title and Action Buttons - matching image 2 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Go back"
              >
                <ChevronLeftIcon />
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Material List</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(prev => !prev)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="More options"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {isMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <ul className="py-1">
                      <li>
                        <button onClick={() => handleExportOption('share')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Share
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            onDuplicate?.();
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Duplicate
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Material List Details Card - matching image 2 layout */}
          <div className={`rounded-2xl p-6 lg:p-8 max-w-2xl shadow-sm ${
            isCompleted ? 'bg-gray-100' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-gray-600">Issue Date: </span>
                <span className="font-medium text-gray-900">{formattedDate}</span>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                isCompleted ? 'bg-green-500 text-white' : isDraft ? 'bg-gray-200 text-gray-700' : 'bg-gray-200 text-gray-700'
              }`}>
                {list.status}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <span className="text-gray-600">Prepared by: </span>
                <span className="font-bold text-gray-900">{list.preparedBy}</span>
              </div>
              <div>
                <span className="text-gray-600">Project: </span>
                <span className="font-medium text-gray-900">{list.projectName}</span>
              </div>
            </div>

            {/* ITEM LISTS Table */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ITEM LISTS</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="col-span-5 text-sm font-semibold text-gray-700">Description</div>
                  <div className="col-span-2 text-sm font-semibold text-gray-700 text-center">Qty</div>
                  <div className="col-span-2 text-sm font-semibold text-gray-700 text-right">Unit Price (₦)</div>
                  <div className="col-span-3 text-sm font-semibold text-gray-700 text-right">Total (₦)</div>
                </div>
                <div className="bg-white">
                  {list.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`grid grid-cols-12 gap-4 px-4 py-3 bg-white ${
                        index !== list.items.length - 1 ? 'border-b border-gray-200' : ''
                      }`}
                    >
                      <div className="col-span-5 text-base text-gray-900 font-medium">{item.description}</div>
                      <div className="col-span-2 text-base text-gray-600 text-center">{item.quantity}</div>
                      <div className="col-span-2 text-base text-gray-600 text-right">{formatNumber(item.unitPrice)}</div>
                      <div className="col-span-3 text-base font-semibold text-gray-900 text-right">{formatNumber(item.total)}</div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-4 bg-gray-50 border-t-2 border-gray-300 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">{formatNaira(list.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Download as PDF button */}
      <footer className="flex-shrink-0 bg-white p-4 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleDownloadPDF}
            className="w-full py-4 bg-gray-800 text-white text-lg font-semibold rounded-lg hover:bg-gray-700 transition-colors"
          >
            Download as PDF
          </button>
        </div>
      </footer>

      {/* Export Options Modal (for Duplicate - opens more export options) */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 animate-slide-up">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Export Options</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleExportOption('pdf')}
                className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-colors text-left px-6 flex items-center gap-4"
              >
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
                <span>PDF Document</span>
              </button>
              <button
                onClick={() => handleExportOption('excel')}
                className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-colors text-left px-6 flex items-center gap-4"
              >
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L13 1.586A2 2 0 0011.586 1H9z" />
                </svg>
                <span>Excel Spreadsheet</span>
              </button>
              <button
                onClick={() => handleExportOption('share')}
                className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-colors text-left px-6 flex items-center gap-4"
              >
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Share / Copy</span>
              </button>
            </div>
            <button
              onClick={() => setShowExportModal(false)}
              className="w-full mt-6 py-3 text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialListPreviewScreen;
