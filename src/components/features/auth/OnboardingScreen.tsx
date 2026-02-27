import React, { useState } from 'react';
import { FirstOnboardingScreenImage, SecondOnboardingScreenImage, ThirdOnboardingScreenImage } from './OnboardingImages';

interface OnboardingScreenProps {
  onComplete: () => void;
}

/** Step 0 = 1.svg (Get estimates done — fast). Step 1 = 2.svg (Material lists in SECONDS, #386A80 card). Step 2 = Reduce OFF-CUTS. Layout: 412×917, 24px inset, card 364×382 rx16, button h-16 rounded-[7px] #2D2E2E, dots #404040/#E5E5E5. */
const ONBOARDING_STEPS = [
  {
    title: (
      <>
        Get <span className="font-extrabold">ESTIMATES</span>
        <br />
        done — fast
      </>
    ),
    description:
      'Build lists, measure quickly, and get quotes — all from your phone.',
    image: <FirstOnboardingScreenImage />,
    cardBg: '#E3EEF3',
  },
  {
    title: (
      <>
        Material list in
        <br />
        <span className="font-extrabold">SECONDS.</span>
      </>
    ),
    description:
      'Turn measurements into material lists instantly — ditch paper and pen.',
    image: <SecondOnboardingScreenImage />,
    cardBg: '#386A80',
  },
  {
    title: (
      <>
        Reduce <span className="font-extrabold">OFF-CUTS</span>
        <br />
        on this project
      </>
    ),
    description:
      'Automatically generate cutting plans and minimize off-cuts to save materials.',
    image: <ThirdOnboardingScreenImage />,
    cardBg: '#E3EEF3',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSlidingUp, setIsSlidingUp] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const goToStep = (index: number) => {
    if (index === currentStep) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(index);
      setIsTransitioning(false);
    }, 200);
  };

  const handleNext = () => {
    if (isLastStep) {
      setIsSlidingUp(true);
      setTimeout(() => onComplete(), 600);
      return;
    }
    goToStep(currentStep + 1);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col bg-white font-exo transition-all duration-[600ms] ease-out ${
        isSlidingUp ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
      role="application"
      aria-label="Onboarding"
    >
      {/* 1.svg: 412×917 — fixed layout, 24px horizontal inset */}
      <div className="mx-auto flex min-h-screen w-full max-w-[412px] flex-col">
        {/* Skip — top right: SVG has rounded-rect stroke #737373, text fill #737373 */}
        <header className="flex h-16 shrink-0 items-center justify-end px-6">
          {!isLastStep && (
            <button
              type="button"
              onClick={onComplete}
              aria-label="Skip onboarding"
              className="rounded-md border border-[#737373] py-2 px-4 text-sm font-medium text-[#737373] transition-colors hover:border-[#2D2E2E] hover:text-[#2D2E2E] focus:outline-none focus:ring-2 focus:ring-[#2D2E2E] focus:ring-offset-2"
            >
              Skip
            </button>
          )}
        </header>

        {/* Content — 1.svg: pt-16 to title, mb-20 to card, 24px horizontal inset */}
        <main className="shrink-0 px-6 pb-6 pt-16" aria-live="polite" aria-atomic="true">
          <section
            aria-labelledby="onboarding-step-title"
            className={`flex flex-col transition-opacity duration-200 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <h1
              id="onboarding-step-title"
              className="mb-2 text-center font-audiowide text-2xl font-light leading-tight text-[#404040] sm:text-3xl"
            >
              {step.title}
            </h1>
            <p className="mx-auto mb-20 max-w-[320px] text-center text-sm leading-snug text-[#737373] sm:text-base">
              {step.description}
            </p>

            {/* Card: 1.svg rect 24,342 364×382 rx16 #E3EEF3 — responsive aspect, max design size */}
            <div
              className="w-full max-w-[364px] overflow-hidden rounded-2xl mx-auto aspect-[364/382] max-h-[382px]"
              style={{ backgroundColor: step.cardBg }}
              aria-hidden="true"
            >
              <div className="h-full w-full">
                {step.image}
              </div>
            </div>
          </section>

          {/* Footer: dots #404040 / #E5E5E5, CTA #2D2E2E — mt-7 card-to-dots */}
          <footer className="mt-7 flex shrink-0 flex-col items-center">
            {/* Dots: SVG design — 18×6px pills, 18px gap, #404040 active / #E5E5E5 inactive */}
            <div className="mb-6 flex items-center justify-center gap-[18px]" role="tablist" aria-label="Onboarding step">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={currentStep === index}
                  aria-label={`Step ${index + 1}`}
                  onClick={() => goToStep(index)}
                  className={`h-[6px] w-[18px] shrink-0 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2D2E2E] focus:ring-offset-2 ${
                    currentStep === index ? 'bg-[#404040]' : 'bg-[#E5E5E5]'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="h-16 w-full rounded-[7px] bg-[#2D2E2E] text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#1a1b1b] focus:outline-none focus:ring-2 focus:ring-[#2D2E2E] focus:ring-offset-2 active:opacity-95"
            >
              {isLastStep ? 'Get Started' : 'Next'}
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default OnboardingScreen;
