
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { userService, subscriptionsService, type CurrentSubscription } from '@/services/api';
import { getUserInitials } from '@/utils/userHelpers';
import { normalizeApiResponse, isApiResponseSuccess, getApiResponseData } from '@/utils/apiResponseHelper';

interface BillingScreenProps {
  onNavigate?: (view: string) => void;
}

const BillingScreen: React.FC<BillingScreenProps> = ({ onNavigate }) => {
  const { user, updateUser } = useAuthStore();
  const [pointsBalance, setPointsBalance] = useState<number | undefined>(user?.pointsBalance);
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Fetch subscription and points balance
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const subscriptionResponse = await subscriptionsService.getCurrent();
        const normalizedResponse = normalizeApiResponse(subscriptionResponse);

        if (normalizedResponse.success && normalizedResponse.response) {
          const responseData = normalizedResponse.response as any;
          const sub = responseData.subscription || responseData;
          setSubscription(sub);
          
          if (sub.pointsBalance !== undefined) {
            setPointsBalance(sub.pointsBalance);
            updateUser({ pointsBalance: sub.pointsBalance });
          }
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, updateUser]);

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      setCancelError(null);

      const response = await subscriptionsService.cancel();
      const normalizedResponse = normalizeApiResponse(response);

      if (normalizedResponse.success) {
        // Refresh subscription data
        const subscriptionResponse = await subscriptionsService.getCurrent();
        const subNormalized = normalizeApiResponse(subscriptionResponse);
        if (subNormalized.success && subNormalized.response) {
          const responseData = subNormalized.response as any;
          const sub = responseData.subscription || responseData;
          setSubscription(sub);
          if (sub.pointsBalance !== undefined) {
            setPointsBalance(sub.pointsBalance);
            updateUser({ pointsBalance: sub.pointsBalance });
          }
        }
        setShowCancelConfirm(false);
        alert('Subscription cancelled successfully. You have been moved to the free tier.');
      } else {
        throw new Error(normalizedResponse.message || 'Failed to cancel subscription');
      }
    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
      setCancelError(
        err?.response?.data?.responseMessage ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to cancel subscription. Please try again.'
      );
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans text-gray-800 p-6">
      <div className="flex-1 overflow-y-auto">
        {/* Subscription & Credits Section */}
        <section className="mb-8">
          <h2 className="text-base font-bold mb-4 text-gray-900">Subscription & Credits</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {/* Subscription Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Subscription Plan</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    subscription?.plan === 'enterprise' 
                      ? 'bg-purple-100 text-purple-800'
                      : subscription?.plan === 'pro'
                      ? 'bg-blue-100 text-blue-800'
                      : subscription?.plan === 'starter'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {subscription?.plan ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : 'Free'}
                  </span>
                  {subscription?.status && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      subscription.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : subscription.status === 'expired'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                  )}
                </div>
                {subscription?.billingCycle && (
                  <p className="text-xs text-gray-500 mt-1">
                    Billed {subscription.billingCycle === 'monthly' ? 'monthly' : 'yearly'}
                  </p>
                )}
                {subscription?.endDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    {subscription.status === 'active' ? 'Renews' : 'Expires'} on{' '}
                    {new Date(subscription.endDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('subscriptionPlans');
                    }
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                >
                  {subscription?.plan && subscription.plan !== 'free' ? 'Change Plan' : 'Upgrade'}
                </button>
                {subscription?.plan && subscription.plan !== 'free' && subscription.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-sm font-medium text-red-600 hover:text-red-800 underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Points Balance */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div 
                className="cursor-pointer"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('creditsHistory');
                  }
                }}
              >
                <p className="text-sm font-medium text-gray-700 mb-1">Available Credits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading 
                    ? '...' 
                    : (pointsBalance !== undefined ? pointsBalance : user?.pointsBalance) !== undefined 
                      ? (pointsBalance !== undefined ? pointsBalance : user?.pointsBalance)!.toLocaleString() 
                      : '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Points remaining</p>
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('creditsHistory');
                    }
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 underline"
                >
                  View History
                </button>
              </div>
            </div>

            {/* Low Points Warning */}
            {!isLoading && ((pointsBalance !== undefined ? pointsBalance : user?.pointsBalance) !== undefined && 
              (pointsBalance !== undefined ? pointsBalance : user?.pointsBalance)! < 50) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">Low Credits Warning</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      You're running low on credits. Consider upgrading your plan to continue using all features.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Payment Method Section */}
        <section className="mb-8">
          <h2 className="text-base font-bold mb-4 text-gray-900">Payment Method</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-600">Card</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">No payment method on file</p>
                  <p className="text-xs text-gray-500">Add a payment method to continue your subscription</p>
                </div>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                Add Payment Method
              </button>
            </div>
          </div>
        </section>

        {/* Billing History Section */}
        <section className="mb-8">
          <h2 className="text-base font-bold mb-4 text-gray-900">Billing History</h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-500">No billing history available</p>
              <p className="text-xs text-gray-400 mt-1">Your invoices and transactions will appear here</p>
            </div>
          </div>
        </section>

        {/* Billing Address Section */}
        <section className="mb-8">
          <h2 className="text-base font-bold mb-4 text-gray-900">Billing Address</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {user?.companyName || 'Company Name'}
                </p>
                <p className="text-sm text-gray-600">
                  {user?.email || 'No address on file'}
                </p>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 underline"
              >
                Edit
              </button>
            </div>
          </div>
        </section>

        {/* Next Billing Date Section */}
        <section className="mb-8">
          <h2 className="text-base font-bold mb-4 text-gray-900">Next Billing Date</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {subscription?.plan === 'free' || !subscription?.endDate
                    ? 'No active subscription'
                    : subscription.status === 'active'
                    ? `Next billing: ${new Date(subscription.endDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}`
                    : 'Subscription expired'}
                </p>
                <p className="text-xs text-gray-500">
                  {subscription?.plan === 'free' || !subscription
                    ? 'Upgrade to a paid plan to enable automatic billing'
                    : subscription.status === 'active'
                    ? 'Your subscription will automatically renew'
                    : 'Your subscription has expired'}
                </p>
              </div>
              {subscription?.plan && subscription.plan !== 'free' && subscription.status === 'active' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                    className="w-4 h-4 text-gray-800 border-gray-300 rounded focus:ring-gray-800"
                  />
                  <span className="text-sm text-gray-700">Auto-renewal</span>
                </label>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Subscription</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel your subscription? You will be moved to the free tier immediately.
              Your points balance will be reset to 50 points.
            </p>
            {cancelError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm">{cancelError}</p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  setCancelError(null);
                }}
                disabled={isCancelling}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingScreen;

