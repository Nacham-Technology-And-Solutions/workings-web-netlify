import React, { useState } from 'react';
import { CheckIcon } from '@/assets/icons/IconComponents';

interface SubscriptionPlansContentProps {
  onBack?: () => void;
}

const BoxIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="100" height="100" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M50.6667 21.3333H13.3333C11.4924 21.3333 10 22.8257 10 24.6667V48C10 49.8409 11.4924 51.3333 13.3333 51.3333H50.6667C52.5076 51.3333 54 49.8409 54 48V24.6667C54 22.8257 52.5076 21.3333 50.6667 21.3333Z" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M32 51.3333V21.3333" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M54 24.6667L32 12.6667L10 24.6667" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M42.6667 33.3333C42.6667 31.8123 42.0696 30.3529 41.0068 29.2901C39.944 28.2273 38.4846 27.6302 37 27.6302L28.3333 21.3333L19.6667 27.6302C18.182 27.6302 16.7226 28.2273 15.66 29.2901C14.5971 30.3529 14 31.8123 14 33.3333C14 34.8544 14.5971 36.3138 15.66 37.3766C16.7226 38.4394 18.182 39.0365 19.6667 39.0365H42.6667" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const plans = [
  {
    name: 'Free Plan',
    description: 'Basic tools to get you started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    subtitle: null,
    features: [
      'Create 1 Project',
      'Generate Quotes (up to 3/mo)',
      'Access Purchase List (up to 3/mo)',
      'Manual Cutting Lists (up to 3/mo)',
    ],
    buttonText: 'Continue with plan',
  },
  {
    name: 'Starter Plan',
    description: 'Work smarter with more features',
    monthlyPrice: 3500,
    yearlyPrice: 42000,
    subtitle: 'Everything in Free, plus',
    features: [
      'Export quotes as PDF & Lists as PDF (with logo)',
      'Include Bank Details on Quotes',
      'Automated Cutting Lists + Off-cut Estimates',
      'Cost Library (manage up to 50 unit rates)',
    ],
    buttonText: 'Subscribe Now',
  },
  {
    name: 'Enterprise Plan',
    description: 'Full access. Maximum Control.',
    monthlyPrice: 25500,
    yearlyPrice: 306000,
    subtitle: 'Everything in Free, plus',
    features: [
      'Unlimited Projects, Quotes & Lists',
      'Advanced Multi-Sheet Cutting Optimization',
      'Branded PDFs (custom header/footer & terms)',
      'Cost Library (unlimited rates + price history)',
      'Unlimited Templates',
      'Early Access to New Features',
    ],
    buttonText: 'Subscribe',
  },
];

type Plan = typeof plans[0];

const PlanCard: React.FC<{ plan: Plan; billingCycle: 'monthly' | 'yearly' }> = ({ plan, billingCycle }) => {
  const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  
  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(p);
  };

  return (
    <div className="bg-gray-100 border border-gray-200 rounded-2xl p-6 flex flex-col h-full relative">
      {/* Icon in top-right corner - aligned with price */}
      <div className="absolute top-6 right-6">
        <BoxIcon />
      </div>

      {/* Price, Name, Description */}
      <div className="pr-28 mb-6">
        <div className="text-4xl font-black text-gray-900 mb-2 leading-tight">
          {plan.name === 'Free Plan' ? '₦0' : `₦${formatPrice(price)}`}
        </div>
        <p className="text-lg font-bold text-gray-900 mb-1">{plan.name}</p>
        <p className="text-sm text-gray-500">{plan.description}</p>
      </div>

      {/* Subtitle */}
      {plan.subtitle && (
        <p className="text-sm font-medium text-gray-700 mb-4">{plan.subtitle}</p>
      )}

      {/* Dashed Blue Divider */}
      <div className="border-t-2 border-dashed border-blue-400 mb-6"></div>

      {/* Features List - flex-grow to take available space */}
      <div className="flex-grow mb-6">
        <ul className="space-y-2.5">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <CheckIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button - mt-auto pushes to bottom */}
      <button className="w-full mt-auto py-3 px-4 bg-gray-800 text-white text-sm font-semibold rounded-full hover:bg-gray-700 transition-colors text-center">
        {plan.buttonText === 'Continue with plan' ? 'Continue with plan >>' : plan.buttonText === 'Subscribe Now' ? 'Subscribe Now >>' : 'Subscribe >>'}
      </button>
    </div>
  );
};

const SubscriptionPlansContent: React.FC<SubscriptionPlansContentProps> = ({ onBack }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="w-full font-sans">
      {/* Top Features Heading */}
      <h2 className="text-xl font-bold text-gray-800 mb-6">Top Features</h2>

      {/* Billing Cycle Toggle - Left Aligned */}
      <div className="flex justify-start mb-6">
        <div className="inline-flex bg-gray-100 p-1 rounded-full">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
              billingCycle === 'monthly' 
                ? 'bg-gray-800 text-white shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
              billingCycle === 'yearly' 
                ? 'bg-gray-800 text-white shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Plan Cards Grid - Three Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full items-stretch">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} billingCycle={billingCycle} />
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlansContent;

