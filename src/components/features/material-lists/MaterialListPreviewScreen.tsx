
import React, { useState } from 'react';
import { formatNaira } from '@/utils/formatters';
import type { FullMaterialList } from '@/types';
import { ChevronLeftIcon, MoreVerticalIcon } from '@/assets/icons/IconComponents';
import { exportMaterialListToPDF, exportMaterialListToExcel, shareData } from '@/services/export/exportService';

interface MaterialListPreviewScreenProps {
  list: FullMaterialList;
  onBack: () => void;
}


const MaterialListPreviewScreen: React.FC<MaterialListPreviewScreenProps> = ({ list, onBack }) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
  const day = date.getUTCDate(); // Use UTC to avoid timezone issues
  const month = date.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  const formattedDate = `${getDayWithSuffix(day)} ${month}, ${year}`;

  const handleExportOption = async (option: 'pdf' | 'excel' | 'share') => {
    setShowExportModal(false);

    try {
      if (option === 'pdf') {
        await exportMaterialListToPDF(list, formattedDate);
        showSuccessMessage('Material list exported as PDF successfully!');
      } else if (option === 'excel') {
        await exportMaterialListToExcel(list, formattedDate);
        showSuccessMessage('Material list exported to Excel successfully!');
      } else if (option === 'share') {
        const shareText = `Material List: ${list.projectName}\nTotal: ${formatNaira(list.total)}\nPrepared by: ${list.preparedBy}`;
        await shareData('Material List', shareText, '');
        showSuccessMessage('Material list shared successfully!');
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportMessage({ type: 'error', text: 'Failed to export. Please try again.' });
      setTimeout(() => setExportMessage(null), 3000);
    }
  };

  const showSuccessMessage = (message: string) => {
    setExportMessage({ type: 'success', text: message });
    setTimeout(() => setExportMessage(null), 3000);
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
      {/* Success/Error Message */}
      {exportMessage && (
        <div
          className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-slide-down ${exportMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
        >
          <p className="text-white font-medium text-center">{exportMessage.text}</p>
        </div>
      )}

      <header className="p-4 flex items-center gap-4 sticky top-0 z-40 bg-white border-b border-gray-200">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900" aria-label="Go back">
          <ChevronLeftIcon />
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1 truncate">{list.projectName}</h1>
        <button
          onClick={() => setShowExportModal(true)}
          className="text-gray-600 hover:text-gray-900"
          aria-label="Export options"
        >
          <MoreVerticalIcon />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-28">
        <div className="space-y-4 text-sm mb-8">
          <div className="flex">
            <span className="w-1/3 text-gray-600">Project Name:</span>
            <span className="w-2/3 font-medium text-gray-900">{list.projectName}</span>
          </div>
          <div className="flex">
            <span className="w-1/3 text-gray-600">Date:</span>
            <span className="w-2/3 font-medium text-gray-900">{formattedDate}</span>
          </div>
          <div className="flex">
            <span className="w-1/3 text-gray-600">Prepared by:</span>
            <span className="w-2/3 font-medium text-gray-900">{list.preparedBy}</span>
          </div>
          <div className="flex">
            <span className="w-1/3 text-gray-600">Status:</span>
            <span className={`w-2/3 font-semibold ${list.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'
              }`}>
              {list.status}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">ITEM LISTS</h3>
          <div className="border-b-2 border-dashed border-gray-300 mb-4"></div>
        </div>

        {/* Item Table */}
        <div className="w-full">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-x-4 text-sm font-medium text-gray-500 pb-2 border-b border-gray-300">
            <div className="col-span-4">Description</div>
            <div className="col-span-2 text-left">Qty</div>
            <div className="col-span-3 text-left">Unit Price(₦)</div>
            <div className="col-span-3 text-left">Total(₦)</div>
          </div>

          {/* Table Body */}
          <div className="mt-1">
            {list.items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-x-4 items-start py-3 border-b border-gray-200 text-sm">
                <div className="col-span-4 text-gray-800 font-medium break-words">
                  {item.description}
                </div>
                <div className="col-span-2 text-gray-600 text-left">
                  {item.quantity}
                </div>
                <div className="col-span-3 text-gray-600 text-left">
                  {item.unitPrice.toLocaleString('en-US')}
                </div>
                <div className="col-span-3 font-semibold text-gray-800 text-left">
                  {item.total.toLocaleString('en-US')}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t-2 border-gray-300 flex justify-between items-center">
            <span className="text-xl font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-gray-900">{formatNaira(list.total)}</span>
          </div>
        </div>
      </main>

      <footer className="bg-white p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => handleExportOption('pdf')}
            className="w-full py-4 bg-gray-800 text-white text-lg font-semibold rounded-lg hover:bg-gray-700 transition-colors"
          >
            Download as PDF
          </button>
        </div>
      </footer>

      {/* Export Options Modal */}
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
