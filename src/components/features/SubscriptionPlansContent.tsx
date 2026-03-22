import React, { useState, useEffect } from 'react';
import { CheckIcon } from '@/assets/icons/IconComponents';
import { subscriptionsService, type SubscriptionPlan, type PaymentProvider, type BillingCycle } from '@/services/api/subscriptions.service';

interface SubscriptionPlansContentProps {
  onBack?: () => void;
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  currentPlanId?: string;
  isLoading?: boolean;
  onSubscribe: (planId: string) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, billingCycle, currentPlanId, isLoading, onSubscribe }) => {
  const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const isCurrentPlan = currentPlanId === plan.id;
  const isFreePlan = plan.id === 'free';
  
  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(p);
  };

  return (
    <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 sm:p-6 flex flex-col h-full relative">
      {/* Icon in top-right corner - aligned with price */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <img src="/icons/subscription-package-icon.svg" alt="" className="w-12 h-12 sm:w-14 sm:h-14" aria-hidden />
      </div>

      {/* Price, Name, Description */}
      <div className="pr-16 sm:pr-28 mb-4 sm:mb-6">
        <div className="text-2xl sm:text-4xl font-black text-gray-900 mb-2 leading-tight">
          {isFreePlan ? '₦0' : `₦${formatPrice(price)}`}
        </div>
        <p className="text-base sm:text-lg font-bold text-gray-900 mb-1">{plan.name}</p>
        <p className="text-xs sm:text-sm text-gray-500">
          {plan.projectsLimit === null ? 'Unlimited projects' : `${plan.projectsLimit} projects/month`}
          {plan.pointsPerMonth > 0 && ` • ${plan.pointsPerMonth} points/month`}
        </p>
      </div>

      {/* Dashed Blue Divider */}
      <div className="border-t-2 border-dashed border-blue-400 mb-4 sm:mb-6"></div>

      {/* Features List - flex-grow to take available space */}
      <div className="flex-grow mb-4 sm:mb-6">
        <ul className="space-y-2 sm:space-y-2.5">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 sm:gap-2.5">
              <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span className="text-xs sm:text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button - mt-auto pushes to bottom */}
      <button
        onClick={() => !isCurrentPlan && !isLoading && !isFreePlan && onSubscribe(plan.id)}
        disabled={isCurrentPlan || isLoading || isFreePlan}
        className={`w-full mt-auto py-2.5 sm:py-3 px-4 text-sm font-semibold rounded-full transition-colors text-center ${
          isCurrentPlan
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : isFreePlan
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : isLoading
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-gray-800 text-white hover:bg-gray-700'
        }`}
      >
        {isCurrentPlan
          ? 'Current Plan'
          : isFreePlan
          ? 'Continue with plan >>'
          : isLoading
          ? 'Processing...'
          : 'Subscribe Now >>'}
      </button>
    </div>
  );
};

const SubscriptionPlansContent: React.FC<SubscriptionPlansContentProps> = ({ onBack }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [defaultProvider, setDefaultProvider] = useState<PaymentProvider>('paystack');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load plans, payment providers, and current subscription
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [plansResponse, providersResponse, currentResponse] = await Promise.all([
        subscriptionsService.getPlans(),
        subscriptionsService.getPaymentProviders(),
        subscriptionsService.getCurrent().catch(() => null), // Don't fail if not authenticated
      ]);

      if (plansResponse.response?.plans) {
        setPlans(plansResponse.response.plans);
      }

      if (providersResponse.response) {
        const enabledProviders = providersResponse.response.providers
          .filter(p => p.enabled)
          .map(p => p.name);
        setPaymentProviders(enabledProviders);
        setDefaultProvider(providersResponse.response.defaultProvider);
        setSelectedProvider(providersResponse.response.defaultProvider);
      }

      if (currentResponse?.response?.subscription) {
        setCurrentPlanId(currentResponse.response.subscription.plan);
      }
    } catch (err: any) {
      console.error('Failed to load subscription data:', err);
      setError(err?.response?.data?.responseMessage || err?.message || 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!selectedProvider) {
      setError('Please select a payment provider');
      return;
    }

    try {
      setSubscribingPlanId(planId);
      setError(null);

      const response = await subscriptionsService.subscribe({
        plan: planId as any,
        billingCycle,
        paymentProvider: selectedProvider,
      });

      if (response.response?.authorizationUrl) {
        // Store payment reference for verification
        if (response.response.reference) {
          localStorage.setItem('paymentReference', response.response.reference);
          localStorage.setItem('paymentProvider', response.response.paymentProvider);
        }

        // Redirect to payment page
        window.location.href = response.response.authorizationUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      const errorMessage =
        err?.response?.data?.responseMessage ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to initialize payment. Please try again.';
      setError(errorMessage);
      setSubscribingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full font-sans flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  if (error && plans.length === 0) {
    return (
      <div className="w-full font-sans">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans">
      {/* Top Features Heading */}
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Top Features</h2>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Billing Cycle Toggle - Left Aligned, responsive padding */}
      <div className="flex justify-start mb-4 sm:mb-6 overflow-x-auto">
        <div className="inline-flex bg-gray-100 p-1 rounded-full flex-shrink-0">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 ${
              billingCycle === 'monthly'
                ? 'bg-gray-800 text-white shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 ${
              billingCycle === 'yearly'
                ? 'bg-gray-800 text-white shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Payment Provider Selection */}
      {paymentProviders.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Provider
          </label>
          <select
            value={selectedProvider || defaultProvider}
            onChange={(e) => setSelectedProvider(e.target.value as PaymentProvider)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
          >
            {paymentProviders.map((provider) => (
              <option key={provider} value={provider}>
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Plan Cards Grid - Three Columns; single column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full items-stretch">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            currentPlanId={currentPlanId || undefined}
            isLoading={subscribingPlanId === plan.id}
            onSubscribe={handleSubscribe}
          />
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlansContent;
