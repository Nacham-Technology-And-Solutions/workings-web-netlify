import React, { useState } from 'react';
import { FirstOnboardingScreenImage, SecondOnboardingScreenImage, ThirdOnboardingScreenImage } from './OnboardingImages';

interface OnboardingScreenProps {
  onComplete: () => void;
}

/** Step 0–2: onboarding SVGs in card 364×382 rx16; CTA #2D2E2E; dots #404040/#E5E5E5. Layout uses h-dvh flex column so footer stays visible without scrolling. */
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
      {/* Single column fills dynamic viewport; overflow hidden — compact, no scroll */}
      <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-[412px] flex-col overflow-hidden">
        <header className="flex h-11 shrink-0 items-center justify-end px-5 pt-[max(0.25rem,env(safe-area-inset-top))] sm:h-12 sm:px-6">
          {!isLastStep && (
            <button
              type="button"
              onClick={onComplete}
              aria-label="Skip onboarding"
              className="rounded-md border border-[#737373] py-1.5 px-3 text-xs font-medium text-[#737373] transition-colors hover:border-[#2D2E2E] hover:text-[#2D2E2E] focus:outline-none focus:ring-2 focus:ring-[#2D2E2E] focus:ring-offset-2 sm:py-2 sm:px-4 sm:text-sm"
            >
              Skip
            </button>
          )}
        </header>

        <main
          className="flex min-h-0 flex-1 flex-col px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-4 sm:pt-3"
          aria-live="polite"
          aria-atomic="true"
        >
          <section
            aria-labelledby="onboarding-step-title"
            className={`flex min-h-0 flex-1 flex-col transition-opacity duration-200 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <h1
              id="onboarding-step-title"
              className="mb-1 text-center font-audiowide text-xl font-light leading-tight text-[#404040] sm:mb-2 sm:text-2xl md:text-3xl"
            >
              {step.title}
            </h1>
            <p className="mx-auto mb-3 max-w-[320px] text-center text-xs leading-snug text-[#737373] sm:mb-4 sm:text-sm md:text-base">
              {step.description}
            </p>

            {/* Card shrinks to fit remaining height; keeps ~364:382 up to design max */}
            <div className="flex min-h-0 flex-1 items-center justify-center py-1">
              <div
                className="aspect-[364/382] w-full max-w-[364px] max-h-[min(382px,46dvh)] overflow-hidden rounded-2xl sm:max-h-[min(382px,50dvh)]"
                style={{ backgroundColor: step.cardBg }}
                aria-hidden="true"
              >
                <div className="h-full w-full min-h-0">{step.image}</div>
              </div>
            </div>
          </section>

          <footer className="mt-2 flex shrink-0 flex-col items-center sm:mt-3">
            <div
              className="mb-3 flex items-center justify-center gap-[18px] sm:mb-4"
              role="tablist"
              aria-label="Onboarding step"
            >
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
              className="h-12 w-full rounded-[7px] bg-[#2D2E2E] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1a1b1b] focus:outline-none focus:ring-2 focus:ring-[#2D2E2E] focus:ring-offset-2 active:opacity-95 sm:h-14 sm:text-base"
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
