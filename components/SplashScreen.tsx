import React from 'react';
import { WorkingsLogo } from './icons/IconComponents';

interface SplashScreenProps {
  isHiding: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ isHiding }) => {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 bg-white flex flex-col items-center justify-center z-50 transition-opacity duration-500 ${
        isHiding ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center transition-transform duration-700 ease-in-out ${
          isHiding ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <WorkingsLogo className="w-40 h-40 text-gray-800" isAnimated={true} />
        <h1
          className="text-5xl font-bold text-gray-700 tracking-wider mt-4 opacity-0 workings-title"
          style={{ fontFamily: 'sans-serif' }}
        >
          Workings
        </h1>
      </div>
    </div>
  );
};

export default SplashScreen;
