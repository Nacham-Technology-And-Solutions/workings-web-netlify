
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { userService, subscriptionsService, type CurrentSubscription, type SubscriptionHistoryItem } from '@/services/api';
import { normalizeApiResponse } from '@/utils/apiResponseHelper';

type BillingSettingsSection = 'profile' | 'subscriptionPlans';

interface BillingScreenProps {
  onNavigate?: (view: string) => void;
  onSectionChange?: (section: BillingSettingsSection) => void;
}

const BillingScreen: React.FC<BillingScreenProps> = ({ onNavigate, onSectionChange }) => {
  const { user, updateUser } = useAuthStore();
  const [pointsBalance, setPointsBalance] = useState<number | undefined>(user?.pointsBalance);
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelSuccessMessage, setCancelSuccessMessage] = useState<string | null>(null);

  const goToSubscriptionPlans = () => {
    if (onSectionChange) {
      onSectionChange('subscriptionPlans');
      return;
    }
    onNavigate?.('subscriptionPlans');
  };

  const goToProfile = () => {
    if (onSectionChange) {
      onSectionChange('profile');
      return;
    }
    onNavigate?.('profile');
  };

  const goToCreditsHistory = () => {
    onNavigate?.('creditsHistory');
  };

  // Fetch subscription, billing history, and profile (for billing address)
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const [subscriptionResponse, historyResponse, profileResponse] = await Promise.all([
          subscriptionsService.getCurrent(),
          subscriptionsService.getHistory().catch(() => null),
          userService.getProfile(user.id).catch(() => null),
        ]);

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

        if (historyResponse?.response?.history) {
          setBillingHistory(historyResponse.response.history);
        }

        if (profileResponse) {
          const profileNormalized = normalizeApiResponse(profileResponse);
          if (profileNormalized.success && profileNormalized.response) {
            const responseData = profileNormalized.response as any;
            const userProfile = responseData.userProfile || responseData.user || responseData;
            updateUser({
              companyName: userProfile.companyName,
              companyAddress: userProfile.companyAddress,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching billing data:', err);
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
        setCancelSuccessMessage('Subscription cancelled. You have been moved to the free tier.');
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
    <div className="flex flex-col h-full bg-white font-sans text-gray-800 p-4 sm:p-6">
      <div className="flex-1 overflow-y-auto">
        {cancelSuccessMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-start justify-between gap-3">
            <p className="text-sm text-green-800">{cancelSuccessMessage}</p>
            <button
              type="button"
              onClick={() => setCancelSuccessMessage(null)}
              className="text-green-700 hover:text-green-900 text-sm font-medium flex-shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Subscription & Credits Section */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-base font-bold mb-4 text-gray-900">Subscription & Credits</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {/* Subscription Status */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
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
              <div className="flex flex-col gap-2 items-stretch sm:items-end">
                <button
                  type="button"
                  onClick={goToSubscriptionPlans}
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200">
              <div
                className="cursor-pointer min-w-0"
                onClick={goToCreditsHistory}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToCreditsHistory();
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
              <div className="text-left sm:text-right">
                <button
                  type="button"
                  onClick={goToCreditsHistory}
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

        {/* Billing History Section */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-base font-bold mb-4 text-gray-900">Billing History</h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-3" />
                <p className="text-sm text-gray-500">Loading billing history...</p>
              </div>
            ) : billingHistory.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500">No billing history available</p>
                <p className="text-xs text-gray-400 mt-1">Your subscription payments will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {billingHistory.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {item.plan} · {item.billingCycle}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        · {item.paymentProvider}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: item.currency || 'NGN',
                        maximumFractionDigits: 0,
                      }).format(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Billing Address Section */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-base font-bold mb-4 text-gray-900">Billing Address</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {user?.companyName || 'Company Name'}
                </p>
                <p className="text-sm text-gray-600 break-words">
                  {user?.companyAddress || 'No billing address on file'}
                </p>
              </div>
              <button
                type="button"
                onClick={goToProfile}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 underline flex-shrink-0 self-start sm:self-auto"
              >
                Edit in Profile
              </button>
            </div>
          </div>
        </section>

        {/* Next Billing Date Section */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-base font-bold mb-4 text-gray-900">Next Billing Date</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
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
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                  Auto-renewal enabled
                </span>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full my-auto shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Subscription</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel your subscription? You will be moved to the free tier immediately.
              Your credits will be reset to the free plan allocation (30 credits).
            </p>
            {cancelError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm">{cancelError}</p>
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  setCancelError(null);
                }}
                disabled={isCancelling}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 w-full sm:w-auto"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 w-full sm:w-auto"
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

