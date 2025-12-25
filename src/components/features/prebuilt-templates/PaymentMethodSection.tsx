import React, { useState } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import type { PaymentMethod } from '@/types/templates';

const PaymentMethodSection: React.FC = () => {
  const {
    paymentMethods,
    paymentMethodConfig,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    updatePaymentMethodConfig,
  } = useTemplateStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
  });

  const handleAddNew = () => {
    setFormData({ accountName: '', accountNumber: '', bankName: '' });
    setEditingMethod(null);
    setShowAddModal(true);
  };

  const handleEdit = (method: PaymentMethod) => {
    setFormData({
      accountName: method.accountName,
      accountNumber: method.accountNumber,
      bankName: method.bankName,
    });
    setEditingMethod(method);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      deletePaymentMethod(id);
    }
  };

  const handleSave = () => {
    if (!formData.accountName || !formData.accountNumber || !formData.bankName) {
      alert('Please fill in all fields');
      return;
    }

    if (editingMethod) {
      updatePaymentMethod(editingMethod.id, formData);
    } else {
      addPaymentMethod(formData);
    }

    setShowAddModal(false);
    setFormData({ accountName: '', accountNumber: '', bankName: '' });
    setEditingMethod(null);
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setFormData({ accountName: '', accountNumber: '', bankName: '' });
    setEditingMethod(null);
  };

  return (
    <div className="space-y-6">
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
              Manage your default payment methods for quotes
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            + Add Payment Method
          </button>
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
                onClick={handleAddNew}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800"
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
                        onClick={() => setDefaultPaymentMethod(method.id)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(method)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="Enter account name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Enter account number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Enter bank name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {editingMethod ? 'Update' : 'Add'} Payment Method
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSection;

