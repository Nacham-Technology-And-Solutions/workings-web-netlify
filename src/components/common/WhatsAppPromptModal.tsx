import React, { useState, useEffect } from 'react';

interface WhatsAppPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (phoneNumber: string) => Promise<void>;
}

const WhatsAppPromptModal: React.FC<WhatsAppPromptModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (phoneNumber.length > 30) {
      setError('Phone number cannot exceed 30 characters.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onSave(phoneNumber);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save phone number. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-auto shadow-2xl border border-gray-100 animate-scale-up">
        {/* Brand Icon */}
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100">
          <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.637-1.03-5.114-2.905-6.989-1.874-1.873-4.324-2.906-6.953-2.907-5.442 0-9.866 4.42-9.869 9.866-.001 1.77.464 3.506 1.346 5.04l-.979 3.575 3.666-.961zm11.226-6.082c-.301-.15-1.78-.879-2.056-.979-.275-.1-.476-.15-.675.15-.199.299-.773.979-.948 1.178-.175.199-.35.224-.651.075-3.012-1.503-4.942-2.483-6.924-5.882-.261-.448.261-.416.746-1.38.08-.162.04-.301-.02-.45-.06-.15-.476-1.146-.651-1.571-.171-.41-.344-.353-.472-.359-.122-.007-.263-.008-.403-.008-.14 0-.368.053-.56.262-.193.21-.735.719-.735 1.753 0 1.034.75 2.032.855 2.17.104.137 1.477 2.257 3.579 3.167 2.1.91 2.1 1.129 2.485 1.093.385-.035 1.78-.729 2.03-1.433.25-.704.25-1.306.175-1.433-.075-.127-.275-.202-.575-.351z"/>
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center font-exo">
          Add WhatsApp Number
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-600 mb-6 text-center leading-relaxed font-exo">
          Please provide your WhatsApp number for faster communication, support, and direct updates during this beta test phase.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="modal-phone" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              WhatsApp Number
            </label>
            <input
              id="modal-phone"
              type="text"
              required
              placeholder="e.g. +234 913 537 7427"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400 font-medium transition-all"
            />
            {error && (
              <p className="text-xs text-red-600 mt-2 font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed font-exo flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                'Save Number'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors font-exo rounded-xl border border-transparent hover:border-gray-100 hover:bg-gray-50/50"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppPromptModal;
