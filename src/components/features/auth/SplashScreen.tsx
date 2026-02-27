import React, { useState, useEffect } from 'react';
import { WorkingsLogo } from '@/assets/icons/IconComponents';

interface SplashScreenProps {
  onComplete: () => void;
}

const SPLASH_DURATION_MS = 2500;
const SLIDE_UP_DURATION_MS = 600;

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isSlidingUp, setIsSlidingUp] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsSlidingUp(true);
    }, SPLASH_DURATION_MS);
    const completeTimer = setTimeout(() => {
      onComplete();
    }, SPLASH_DURATION_MS + SLIDE_UP_DURATION_MS);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 bg-white flex flex-col items-center justify-center z-50 transition-all duration-[600ms] ease-out ${
        isSlidingUp ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center justify-center transition-transform duration-[600ms] ease-out ${
          isSlidingUp ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <WorkingsLogo className="w-32 h-32 sm:w-40 sm:h-40 text-primary" isAnimated={true} />
      </div>
    </div>
  );
};

export default SplashScreen;
