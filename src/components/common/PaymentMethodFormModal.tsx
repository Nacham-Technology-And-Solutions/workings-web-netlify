import React, { useState, useEffect } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import type { PaymentMethod } from '@/types/templates';

interface PaymentMethodFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (method: PaymentMethod) => void;
  editingMethod?: PaymentMethod | null;
}

const PaymentMethodFormModal: React.FC<PaymentMethodFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editingMethod = null,
}) => {
  const { addPaymentMethod, updatePaymentMethod } = useTemplateStore();
  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingMethod) {
      setFormData({
        accountName: editingMethod.accountName,
        accountNumber: editingMethod.accountNumber,
        bankName: editingMethod.bankName,
      });
    } else {
      setFormData({ accountName: '', accountNumber: '', bankName: '' });
    }
  }, [isOpen, editingMethod]);

  const handleSave = async () => {
    if (isSaving) return;
    if (!formData.accountName || !formData.accountNumber || !formData.bankName) {
      alert('Please fill in all fields');
      return;
    }

    setIsSaving(true);
    try {
      if (editingMethod) {
        await updatePaymentMethod(editingMethod.id, formData);
        onSaved?.({ ...editingMethod, ...formData });
      } else {
        const beforeIds = new Set(useTemplateStore.getState().paymentMethods.map((m) => m.id));
        await addPaymentMethod(formData);
        const added =
          useTemplateStore.getState().paymentMethods.find((m) => !beforeIds.has(m.id)) ??
          useTemplateStore.getState().getDefaultPaymentMethod();
        if (added) onSaved?.(added);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isSaving) return;
    onClose();
  };

  if (!isOpen) return null;

  return (
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
              disabled={isSaving}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500"
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
              disabled={isSaving}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500"
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
              disabled={isSaving}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving
              ? editingMethod
                ? 'Updating…'
                : 'Adding…'
              : `${editingMethod ? 'Update' : 'Add'} Payment Method`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodFormModal;
