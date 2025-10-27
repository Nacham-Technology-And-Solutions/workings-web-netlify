import React, { useState } from 'react';
import { OnboardingImage1, OnboardingImage2, OnboardingImage3 } from './OnboardingImages';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const onboardingSteps = [
  {
    title: <>Material lists in <span className="font-extrabold">SECONDS</span></>,
    description: "Turn measurements into material lists instantly — ditch paper and pen.",
    image: <OnboardingImage1 />,
  },
  {
    title: <>Get <span className="font-extrabold">ESTIMATES</span><br/>done — fast</>,
    description: "Build lists, measure quickly, and get quotes — all from your phone.",
    image: <OnboardingImage2 />,
  },
  {
    title: <>Reduce <span className="font-extrabold">OFF-CUTS</span><br/>on this project</>,
    description: "Automatically generate cutting plans and minimize off-cuts to save materials.",
    image: <OnboardingImage3 />,
  }
];


const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isSlidingUp, setIsSlidingUp] = useState(false);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      changeStep(currentStep + 1);
    } else {
      // Enhanced slide-up animation with better timing
      setIsSlidingUp(true);
      setTimeout(() => {
        onComplete();
      }, 600); // Slightly longer for smoother transition
    }
  };

  const changeStep = (stepIndex: number) => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentStep(stepIndex);
      setIsFading(false);
    }, 150); // Faster transition for better responsiveness
  }

  const { title, description, image } = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
        <div className={`fixed inset-0 bg-main flex flex-col items-center justify-center z-50 p-6 font-exo transition-all duration-600 ease-out ${
          isSlidingUp ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}>
      <div className="w-full max-w-sm mx-auto flex flex-col h-full">
        {/* Skip Button */}
        <div className="h-10 flex justify-end items-start">
          {!isLastStep && (
            <button
              onClick={onComplete}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Skip
            </button>
          )}
        </div>

        {/* Content */}
            <div className={`flex-grow flex flex-col text-center transition-all duration-300 ease-out ${isFading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
              <h1 className="text-3xl font-light text-text-primary leading-tight mb-3 font-audiowide">
                {title}
              </h1>
              <p className="text-text-secondary mb-8 max-w-xs mx-auto font-exo">
                {description}
              </p>
          <div className="flex-grow flex items-center justify-center">
            {image}
          </div>
        </div>

        {/* Footer */}
        <div className="h-28 flex flex-col justify-end items-center">
          <div className="flex gap-2 mb-6">
            {onboardingSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => changeStep(index)}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  currentStep === index ? 'bg-gray-700' : 'bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
              <button
                onClick={handleNext}
                className="w-full py-4 text-lg font-semibold text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-all duration-200 font-exo"
              >
                {isLastStep ? 'Get Started' : 'Next'}
              </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;