import React, { useState } from 'react';
import { OnboardingImage1, OnboardingImage2, OnboardingImage3 } from './OnboardingImages';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const onboardingSteps = [
  {
    title: <>Get <span className="font-extrabold">ESTIMATES</span><br/>done — fast</>,
    description: "Build lists, measure quickly, and get quotes — all from your phone.",
    image: <OnboardingImage2 />,
  },
  {
    title: <>Material lists in <span className="font-extrabold">SECONDS</span></>,
    description: "Turn measurements into material lists instantly — ditch paper and pen.",
    image: <OnboardingImage3 />,
  },
  {
    title: <>Reduce <span className="font-extrabold">OFF-CUTS</span><br/>on this project</>,
    description: "Automatically generate cutting plans and minimize off-cuts to save materials.",
    image: <OnboardingImage1 />,
  }
];


const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      changeStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const changeStep = (stepIndex: number) => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentStep(stepIndex);
      setIsFading(false);
    }, 200); // Half of the transition duration
  }

  const { title, description, image } = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-6 font-sans">
      <div className="w-full max-w-sm mx-auto flex flex-col h-full">
        {/* Skip Button */}
        <div className="h-10 flex justify-end items-start">
          {!isLastStep && (
            <button
              onClick={onComplete}
              className="px-4 py-1 text-sm font-medium text-gray-500 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
            >
              Skip
            </button>
          )}
        </div>

        {/* Content */}
        <div className={`flex-grow flex flex-col text-center transition-opacity duration-200 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
          <h1 className="text-3xl font-light text-gray-800 leading-tight mb-3">
            {title}
          </h1>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">
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
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentStep === index ? 'w-6 bg-gray-800' : 'bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="w-full py-4 text-lg font-semibold text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 transform hover:scale-105"
          >
            {isLastStep ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;