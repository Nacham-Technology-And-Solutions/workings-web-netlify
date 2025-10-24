
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CloseIcon, CheckIcon, PlanIcon } from './icons/IconComponents';

interface SubscriptionPlanScreenProps {
  onBack: () => void;
}

const DoubleArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>
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
    buttonText: 'Subscribe Now',
  },
];

type Plan = typeof plans[0];

const PlanCard: React.FC<{ plan: Plan; billingCycle: 'monthly' | 'yearly' }> = ({ plan, billingCycle }) => {
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    
    const formatPrice = (p: number) => p.toLocaleString('en-NG');

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    {plan.name === 'Free Plan' ? (
                        <h3 className="text-4xl font-black text-gray-800"><span className="line-through">N</span>0</h3>
                    ) : (
                        <h3 className="text-4xl font-black text-gray-800">
                            ₦{formatPrice(price)}
                        </h3>
                    )}
                    <p className="text-lg font-bold text-gray-800 mt-1">{plan.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                </div>
                <div className="bg-teal-50 p-1 rounded-xl">
                    <PlanIcon />
                </div>
            </div>

            <hr className="border-gray-200 my-6"/>
            
            <div className="flex-grow">
                {plan.subtitle && (
                    <p className="text-gray-700 font-medium mb-4">{plan.subtitle}</p>
                )}
                <ul className="space-y-4">
                    {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                            <CheckIcon className="w-6 h-6 text-teal-600 flex-shrink-0" strokeWidth={2.5} />
                            <span className="text-gray-700 font-medium">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <button className="w-full mt-8 py-4 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                {plan.buttonText}
                {plan.name === 'Free Plan' && <DoubleArrowRightIcon />}
            </button>
        </div>
    );
};

const SubscriptionPlanScreen: React.FC<SubscriptionPlanScreenProps> = ({ onBack }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const planRefs = useRef<(HTMLDivElement | null)[]>([]);

  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
        setCurrentPlanIndex(index);
        return;
      }
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      root: scrollContainerRef.current,
      threshold: 0.7,
    });
    
    planRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
        planRefs.current.forEach(ref => {
            if (ref) observer.unobserve(ref);
        });
    };
  }, [observerCallback]);

  const handleDotClick = (index: number) => {
    planRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  };
  
  // Clear refs array on re-render before populating it again
  planRefs.current = [];

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-800">
      <header className="p-4 flex justify-between items-center sticky top-0 z-40 bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-800">Pick Your Plan</h1>
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center bg-gray-200/50 rounded-full text-gray-600 hover:bg-gray-300/50"
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </header>
      
      <main className="flex-1 flex flex-col overflow-hidden px-4 py-6">
        <div className="flex justify-center mb-8">
          <div className="bg-gray-200/70 p-1 rounded-full flex items-center">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-8 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                billingCycle === 'monthly' ? 'bg-gray-800 text-white shadow' : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-8 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                billingCycle === 'yearly' ? 'bg-gray-800 text-white shadow' : 'text-gray-600'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-4 px-2">Top Features</h2>

        <div 
          ref={scrollContainerRef} 
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {plans.map((plan, index) => (
            <div 
              key={plan.name}
              ref={el => { if(el) planRefs.current[index] = el; }}
              data-index={index}
              className="w-full flex-shrink-0 snap-center"
            >
              <PlanCard plan={plan} billingCycle={billingCycle} />
            </div>
          ))}
        </div>
        
        <div className="flex justify-center items-center gap-2 mt-6">
            {plans.map((_, index) => (
                <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                        currentPlanIndex === index ? 'w-6 bg-gray-800' : 'w-2 bg-gray-300'
                    }`}
                    aria-label={`Go to plan ${index + 1}`}
                />
            ))}
        </div>
      </main>
    </div>
  );
};

export default SubscriptionPlanScreen;
