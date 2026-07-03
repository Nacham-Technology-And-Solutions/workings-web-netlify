import React, { useEffect, useState } from 'react';
import { subscriptionsService } from '@/services/api/subscriptions.service';
import {
  clearPaymentCallback,
  getPaymentReferenceFromUrl,
  isPaymentCallbackExpired,
  readPaymentCallback,
  savePaymentCallback,
} from '@/utils/paymentCallbackStorage';

interface PaymentCallbackScreenProps {
  onSuccess?: () => void;
  onFailure?: (error: string) => void;
  onDismiss?: () => void;
}

const PaymentCallbackScreen: React.FC<PaymentCallbackScreenProps> = ({
  onSuccess,
  onFailure,
  onDismiss,
}) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'pending'>('verifying');
  const [message, setMessage] = useState<string>('Verifying payment...');
  const [showEscapeHatch, setShowEscapeHatch] = useState(false);

  useEffect(() => {
    const escapeTimer = window.setTimeout(() => setShowEscapeHatch(true), 15_000);
    void verifyPayment(0);
    return () => window.clearTimeout(escapeTimer);
  }, []);

  const finishSuccess = (successMessage: string) => {
    setStatus('success');
    setMessage(successMessage);
    clearPaymentCallback();
    setTimeout(() => onSuccess?.(), 2000);
  };

  const finishFailure = (errorMessage: string) => {
    setStatus('failed');
    setMessage(errorMessage);
    clearPaymentCallback();
    onFailure?.(errorMessage);
  };

  const verifyPayment = async (networkRetryCount: number) => {
    try {
      const refFromUrl = getPaymentReferenceFromUrl();
      let stored = readPaymentCallback();

      if (refFromUrl) {
        const provider = stored?.provider || 'paystack';
        savePaymentCallback(refFromUrl, provider);
        stored = readPaymentCallback();
      }

      if (window.location.search) {
        window.history.replaceState(null, '', window.location.pathname + window.location.hash);
      }

      if (stored && isPaymentCallbackExpired(stored)) {
        clearPaymentCallback();
        onDismiss?.();
        return;
      }

      const reference = refFromUrl || stored?.reference;
      if (!reference) {
        finishFailure('No payment reference found. Please contact support if you completed the payment.');
        return;
      }

      const provider = stored?.provider || 'paystack';

      try {
        const currentResponse = await subscriptionsService.getCurrent();
        const subscription = currentResponse?.response?.subscription;
        if (subscription?.status === 'active' && subscription.plan !== 'free') {
          finishSuccess('Your subscription is already active.');
          return;
        }
      } catch {
        // Continue with verify if current subscription check fails
      }

      const verifyResponse = await subscriptionsService.verifyPayment({ reference, provider });
      const responseBody = verifyResponse?.response;
      const responseStatus = responseBody?.status;

      if (
        responseBody &&
        (responseStatus === 'activated' ||
          responseStatus === 'already_processed' ||
          !responseStatus)
      ) {
        const isAlreadyProcessed =
          responseStatus === 'already_processed' ||
          responseBody.message?.toLowerCase().includes('already');
        finishSuccess(
          isAlreadyProcessed
            ? 'Payment was already processed. Your subscription is active.'
            : 'Payment successful! Your subscription has been activated.'
        );
        return;
      }

      const errMsg =
        verifyResponse?.responseMessage ||
        (verifyResponse as { message?: string })?.message ||
        'Verification failed.';
      finishFailure(errMsg);
    } catch (error: unknown) {
      const isNetworkError =
        error instanceof TypeError || (error as { code?: string })?.code === 'ERR_NETWORK';

      if (isNetworkError && networkRetryCount < 2) {
        setStatus('pending');
        setMessage(`Network error — retrying verification (${networkRetryCount + 1}/2)...`);
        setTimeout(() => {
          void verifyPayment(networkRetryCount + 1);
        }, 2000);
        return;
      }

      console.error('Payment verification error:', error);
      const err = error as {
        response?: { data?: { responseMessage?: string; message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.responseMessage ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to verify payment. Please check your subscription status or contact support.';
      finishFailure(errorMessage);
    }
  };

  const handleDismiss = () => {
    clearPaymentCallback();
    onDismiss?.();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">{message}</p>
            {showEscapeHatch && (
              <button
                onClick={handleDismiss}
                className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go to Settings
              </button>
            )}
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting you back...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Verification Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={handleDismiss}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to Settings
            </button>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              This may take a moment. You can close this window and check your subscription status later.
            </p>
            <button
              onClick={handleDismiss}
              className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallbackScreen;
