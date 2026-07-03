import React, { useState, useEffect, useRef } from 'react';
import PaymentMethodFormModal from '@/components/common/PaymentMethodFormModal';
import { useTemplateStore } from '@/stores/templateStore';
import { useAuthStore } from '@/stores';
import type { PaymentMethod } from '@/types/templates';

const PaymentMethodSection: React.FC = () => {
  const { user } = useAuthStore();
  const {
    paymentMethods,
    paymentMethodConfig,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    updatePaymentMethodConfig,
    addPaymentMethod,
    saveTemplates,
  } = useTemplateStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const skipDisplayOptionsAutosave = useRef(true);

  const displayOptions = paymentMethodConfig.displayOptions;

  useEffect(() => {
    if (skipDisplayOptionsAutosave.current) {
      skipDisplayOptionsAutosave.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      void saveTemplates();
    }, 800);

    return () => window.clearTimeout(timer);
  }, [displayOptions.showInPreview, displayOptions.showInPDF, displayOptions.customInstructions, saveTemplates]);

  const handleAddNew = () => {
    setEditingMethod(null);
    setShowAddModal(true);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      await deletePaymentMethod(id);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingMethod(null);
  };

  const handleImportFromProfile = async () => {
    const bankDetails = user?.bankDetails;
    if (!bankDetails?.accountName || !bankDetails?.accountNumber || !bankDetails?.bankName) {
      setImportMessage({
        type: 'error',
        text: 'Add bank details in Profile first, then import them here.',
      });
      return;
    }

    const alreadyExists = paymentMethods.some(
      (method) =>
        method.accountNumber === bankDetails.accountNumber && method.bankName === bankDetails.bankName
    );
    if (alreadyExists) {
      setImportMessage({ type: 'error', text: 'This profile bank account is already in your quote payment methods.' });
      return;
    }

    await addPaymentMethod({
      accountName: bankDetails.accountName,
      accountNumber: bankDetails.accountNumber,
      bankName: bankDetails.bankName,
    });
    setImportMessage({ type: 'success', text: 'Bank details imported from Profile.' });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <p className="font-medium">Quote payment methods vs Profile bank details</p>
        <p className="mt-1 text-blue-800">
          Templates here control which accounts appear on exported quotes. Your Profile bank details are used when creating
          quotes and can be imported below as a template payment method.
        </p>
      </div>

      {importMessage && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm flex items-start justify-between gap-3 ${
            importMessage.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <p>{importMessage.text}</p>
          <button type="button" onClick={() => setImportMessage(null)} className="font-medium flex-shrink-0">
            Dismiss
          </button>
        </div>
      )}
      {/* Display Options */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Options</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={paymentMethodConfig.displayOptions.showInPreview}
              onChange={(e) =>
                updatePaymentMethodConfig({
                  displayOptions: {
                    ...paymentMethodConfig.displayOptions,
                    showInPreview: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-400"
            />
            <span className="text-sm text-gray-700">Show payment method in quote preview</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={paymentMethodConfig.displayOptions.showInPDF}
              onChange={(e) =>
                updatePaymentMethodConfig({
                  displayOptions: {
                    ...paymentMethodConfig.displayOptions,
                    showInPDF: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-400"
            />
            <span className="text-sm text-gray-700">Show payment method in PDF export</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Payment Instructions (Optional)
            </label>
            <textarea
              value={paymentMethodConfig.displayOptions.customInstructions || ''}
              onChange={(e) =>
                updatePaymentMethodConfig({
                  displayOptions: {
                    ...paymentMethodConfig.displayOptions,
                    customInstructions: e.target.value,
                  },
                })
              }
              placeholder="Enter custom payment instructions that will appear on quotes..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Payment Methods List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
            <p className="text-sm text-gray-600 mt-1">
              Bank accounts shown on quotes. Import from Profile or add additional accounts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleImportFromProfile()}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Import from Profile
            </button>
            <button
              type="button"
              onClick={handleAddNew}
              className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors"
            >
              + Add Payment Method
            </button>
          </div>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first payment method.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleAddNew}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded hover:bg-gray-800"
              >
                + Add Payment Method
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paymentMethods.map((method) => (
              <div key={method.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base font-semibold text-gray-900">
                        {method.accountName}
                      </h4>
                      {method.isDefault && (
                        <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Account Number:</span> {method.accountNumber}
                      </p>
                      <p>
                        <span className="font-medium">Bank:</span> {method.bankName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!method.isDefault && (
                      <button
                        type="button"
                        onClick={async () => await setDefaultPaymentMethod(method.id)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(method)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(method.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PaymentMethodFormModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        editingMethod={editingMethod}
      />
    </div>
  );
};

export default PaymentMethodSection;
