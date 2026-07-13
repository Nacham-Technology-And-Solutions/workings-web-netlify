import React, { useState } from 'react';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';
import { useAuthStore } from '@/stores';
import apiClient from '@/services/api/apiClient';

const SUPPORT_EMAIL = 'support@glazeworkings.com';

type FeedbackCategory = 'bug' | 'feature' | 'general';

interface FeedbackContactScreenProps {
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

const FeedbackContactScreen: React.FC<FeedbackContactScreenProps> = ({ onBack, onNavigate }) => {
  const { user } = useAuthStore();
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setErrorMsg('');
    const filesArray = Array.from(files).slice(0, 3 - images.length);

    filesArray.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Each image file size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImages((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setErrorMsg('');
    try {
      await apiClient.post('/api/v1/complaints', {
        category,
        message: message.trim(),
        email: email.trim(),
        phone: user?.phoneNumber || null,
        images
      });
      setSubmitted(true);
      setMessage('');
      setImages([]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.response?.data?.error || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white font-sans text-gray-800">
      <header className="p-4 lg:p-6 flex items-center gap-4 sticky top-0 z-40 bg-white border-b border-gray-200 shrink-0">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 lg:hover:bg-gray-100 lg:p-2 lg:rounded lg:transition-colors"
          aria-label="Go back"
        >
          <ChevronLeftIcon />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Feedback & Contact Us</h1>
          <p className="hidden md:block text-sm lg:text-base text-gray-600 mt-1">
            Share feedback, report issues, or get in touch. We read every message.
          </p>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 lg:px-8 xl:px-10 py-6 lg:py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Send feedback */}
          <section className="bg-gray-50 rounded-xl border border-gray-200 p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Send feedback</h2>
            <p className="text-sm text-gray-600 mb-5">
              Found a bug, have an idea, or just want to say hello? Fill in below and we will receive it immediately.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: 'bug' as const, label: 'Bug report' },
                      { value: 'feature' as const, label: 'Feature request' },
                      { value: 'general' as const, label: 'General inquiry' },
                    ] as const
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        category === value
                          ? 'bg-gray-800 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="feedback-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your feedback, bug, or question..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800 text-gray-900 placeholder-gray-500 resize-y min-h-[120px]"
                />
              </div>
              <div>
                <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Your email (so we can reply)
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800 text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Attach Images Section */}
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach Screenshots or Images (Optional, max 3)
                </label>
                <div className="flex flex-wrap gap-3 items-center">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-300 shadow-sm shrink-0">
                      <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                        aria-label="Remove image"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <label className="w-20 h-20 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-xl flex flex-col items-center justify-center cursor-pointer shrink-0 transition-colors bg-white hover:bg-gray-50/50">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-[10px] text-gray-400 font-medium mt-1">Add Image</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {errorMsg && (
                <p className="text-sm font-medium text-red-600">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full sm:w-auto px-6 py-3 bg-gray-800 text-white font-medium rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>

              {submitted && (
                <p className="text-sm font-semibold text-emerald-600">
                  Thank you! Your feedback has been submitted successfully.
                </p>
              )}
            </form>
          </section>

          {/* Direct contact */}
          <section className="border border-gray-200 rounded-xl p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Contact us directly</h2>
            <p className="text-sm text-gray-600 mb-4">
              Prefer to write directly? We typically respond within 1–2 business days.
            </p>
            <div className="flex flex-col gap-4">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2 text-gray-800 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 rounded"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {SUPPORT_EMAIL}
              </a>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">WhatsApp Support</h3>
                <p className="text-xs text-gray-600 mb-4">
                  For faster, direct assistance or real-time communication during beta testing, reach out to us on WhatsApp.
                </p>
                <a
                  href="https://wa.me/2349135377427?text=Hello%20Workings%20Support%2C%20I%20have%20some%20feedback%20or%20inquiry%20regarding%20the%20app..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.637-1.03-5.114-2.905-6.989-1.874-1.873-4.324-2.906-6.953-2.907-5.442 0-9.866 4.42-9.869 9.866-.001 1.77.464 3.506 1.346 5.04l-.979 3.575 3.666-.961zm11.226-6.082c-.301-.15-1.78-.879-2.056-.979-.275-.1-.476-.15-.675.15-.199.299-.773.979-.948 1.178-.175.199-.35.224-.651.075-3.012-1.503-4.942-2.483-6.924-5.882-.261-.448.261-.416.746-1.38.08-.162.04-.301-.02-.45-.06-.15-.476-1.146-.651-1.571-.171-.41-.344-.353-.472-.359-.122-.007-.263-.008-.403-.008-.14 0-.368.053-.56.262-.193.21-.735.719-.735 1.753 0 1.034.75 2.032.855 2.17.104.137 1.477 2.257 3.579 3.167 2.1.91 2.1 1.129 2.485 1.093.385-.035 1.78-.729 2.03-1.433.25-.704.25-1.306.175-1.433-.075-.127-.275-.202-.575-.351z" />
                  </svg>
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </section>

          {/* Help & Tips link */}
          {onNavigate && (
            <section className="text-center">
              <p className="text-sm text-gray-600">
                For common questions about projects, quotes, and material lists, see{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('help')}
                  className="font-medium text-gray-800 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 rounded"
                >
                  Help & Tips
                </button>
                .
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default FeedbackContactScreen;
