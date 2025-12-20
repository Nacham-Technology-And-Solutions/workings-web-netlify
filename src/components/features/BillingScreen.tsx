
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { userService, subscriptionsService } from '@/services/api';
import { getUserInitials } from '@/utils/userHelpers';
import { normalizeApiResponse, isApiResponseSuccess, getApiResponseData } from '@/utils/apiResponseHelper';

interface BillingScreenProps {
  onNavigate?: (view: string) => void;
}

const BillingScreen: React.FC<BillingScreenProps> = ({ onNavigate }) => {
  const { user, updateUser } = useAuthStore();
  const [pointsBalance, setPointsBalance] = useState<number | undefined>(user?.pointsBalance);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch subscription and points balance
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const subscriptionResponse = await subscriptionsService.getCurrent();
        const normalizedResponse = normalizeApiResponse(subscriptionResponse);

        if (normalizedResponse.success && normalizedResponse.response) {
          const responseData = normalizedResponse.response as any;
          const subscription = responseData.subscription || responseData;
          
          if (subscription.pointsBalance !== undefined) {
            setPointsBalance(subscription.pointsBalance);
            updateUser({ pointsBalance: subscription.pointsBalance });
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
                    user?.subscriptionStatus === 'enterprise' 
                      ? 'bg-purple-100 text-purple-800'
                      : user?.subscriptionStatus === 'pro'
                      ? 'bg-blue-100 text-blue-800'
                      : user?.subscriptionStatus === 'starter'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.subscriptionStatus ? user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1) : 'Free'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('subscriptionPlans');
                  }
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
              >
                Manage
              </button>
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
                  {user?.subscriptionStatus === 'free' ? 'No active subscription' : 'Not available'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.subscriptionStatus === 'free' 
                    ? 'Upgrade to a paid plan to enable automatic billing'
                    : 'Subscription details will appear here'}
                </p>
              </div>
              {user?.subscriptionStatus !== 'free' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-gray-800 border-gray-300 rounded focus:ring-gray-800"
                  />
                  <span className="text-sm text-gray-700">Auto-renewal</span>
                </label>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BillingScreen;

