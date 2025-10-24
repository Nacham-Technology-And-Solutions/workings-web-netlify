
import React, { ReactNode } from 'react';

// FIX: This file was a placeholder. It now contains the implementation for the AccordionItem component.

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  isCompleted: boolean;
}

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} className="text-cyan-600">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, onToggle, isCompleted }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center p-4 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <CheckCircleIcon />
          ) : (
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isOpen ? 'border-cyan-600 bg-cyan-50' : 'border-gray-300'}`}>
                {isOpen && <div className="w-2 h-2 rounded-full bg-cyan-600"></div>}
            </div>
          )}
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        <div className={`transform transition-transform duration-200 text-gray-500 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <ChevronDownIcon />
        </div>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default AccordionItem;
