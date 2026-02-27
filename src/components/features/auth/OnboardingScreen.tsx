import React, { useState } from 'react';
import { OnboardingImage1, OnboardingImage2, OnboardingImage3 } from './OnboardingImages';

interface OnboardingScreenProps {
  onComplete: () => void;
}

/** Design tokens from SVGs 1/2/3: 412×917, card rx 16, button #2D2E2E, dots #404040 / #E5E5E5 */
const ONBOARDING_STEPS = [
  {
    title: (
      <>
        Material lists in <span className="font-extrabold">SECONDS</span>
      </>
    ),
    description:
      'Turn measurements into material lists instantly — ditch paper and pen.',
    image: <OnboardingImage1 />,
    cardBg: '#E3EEF3', // 1.svg content area
  },
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
    image: <OnboardingImage2 />,
    cardBg: '#386A80', // 2.svg teal content area
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
    image: <OnboardingImage3 />,
    cardBg: '#E3EEF3', // 3.svg content area
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
        {/* Skip — top right (design: ~64px header area) */}
        <header className="flex h-16 shrink-0 items-center justify-end px-6">
          {!isLastStep && (
            <button
              type="button"
              onClick={onComplete}
              className="text-sm font-medium text-[#737373] transition-colors hover:text-[#2D2E2E] focus:outline-none focus:ring-2 focus:ring-[#2D2E2E] focus:ring-offset-2"
            >
              Skip
            </button>
          )}
        </header>

        {/* Content — no flex-1 so spacing matches design; pt-16 ≈ 64px to title */}
        <main className="shrink-0 px-6 pb-6 pt-16">
          <div
            className={`flex flex-col transition-opacity duration-200 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <h1 className="mb-2 text-center font-audiowide text-2xl font-light leading-tight text-[#2D2E2E] sm:text-3xl">
              {step.title}
            </h1>
            <p className="mx-auto mb-20 max-w-[320px] text-center text-sm leading-snug text-[#737373] sm:text-base">
              {step.description}
            </p>

            {/* Card: 1.svg rect 24,342 364×382 rx16 — exact size, image fills */}
            <div
              className="h-[382px] w-full overflow-hidden rounded-2xl"
              style={{ backgroundColor: step.cardBg }}
            >
              <div className="h-full w-full">
                {step.image}
              </div>
            </div>
          </div>

          {/* Footer: design dots ~751, button 802–866 — mt-7 ≈ 27px card-to-dots */}
          <footer className="mt-7 flex shrink-0 flex-col items-center">
            <div className="mb-6 flex items-center justify-center gap-3" role="tablist" aria-label="Onboarding step">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={currentStep === index}
                  aria-label={`Step ${index + 1}`}
                  onClick={() => goToStep(index)}
                  className={`h-2 w-2 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2D2E2E] focus:ring-offset-2 ${
                    currentStep === index ? 'bg-[#404040]' : 'bg-[#E5E5E5]'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-[27px] bg-[#2D2E2E] py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#1a1b1b] focus:outline-none focus:ring-2 focus:ring-[#2D2E2E] focus:ring-offset-2 active:opacity-95"
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
