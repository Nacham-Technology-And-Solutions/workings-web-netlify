import React, { useState } from 'react';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';
import { useAuthStore } from '@/stores';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const subject = encodeURIComponent(`[Workings Feedback] ${category === 'bug' ? 'Bug report' : category === 'feature' ? 'Feature request' : 'General inquiry'}`);
    const body = encodeURIComponent(
      `${message.trim()}\n\n---\nReply-to: ${email || '(not provided)'}\nSent from Workings app.`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white font-sans text-gray-800">
      <header className="p-4 lg:p-6 flex items-center gap-4 sticky top-0 z-40 bg-white border-b border-gray-200 shrink-0">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 lg:hover:bg-gray-100 lg:p-2 lg:rounded-lg lg:transition-colors"
          aria-label="Go back"
        >
          <ChevronLeftIcon />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Feedback & Contact Us</h1>
          <p className="text-sm lg:text-base text-gray-600 mt-1">
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
              Found a bug, have an idea, or just want to say hello? Fill in below and we’ll get an email.
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
              <button
                type="submit"
                disabled={!message.trim()}
                className="w-full sm:w-auto px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Open in email to send
              </button>
              {submitted && (
                <p className="text-sm text-gray-600">
                  Your email client should open with the message ready. Send it from there to reach us.
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
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 text-gray-800 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 rounded"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {SUPPORT_EMAIL}
            </a>
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
