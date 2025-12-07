import React, { useState, useEffect } from 'react';
import { WorkingsLogo } from '@/assets/icons/IconComponents';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHiding(true);
      setTimeout(() => {
        onComplete();
      }, 600); // Wait for fade out animation to complete
    }, 4000); // Show for 4 seconds as specified

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 bg-main flex flex-col items-center justify-center z-50 transition-all duration-600 ease-out ${
        isHiding ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center transition-all duration-700 ease-out ${
          isHiding ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <WorkingsLogo className="w-32 h-32 sm:w-40 sm:h-40 text-primary" isAnimated={true} />
      </div>
    </div>
  );
};

export default SplashScreen;
