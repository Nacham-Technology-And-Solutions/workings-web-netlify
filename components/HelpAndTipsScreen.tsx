
import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronDownIcon, ChevronUpIcon } from './icons/IconComponents';

interface HelpAndTipsScreenProps {
  onBack: () => void;
}

const helpTopics = [
  {
    id: 'get-started',
    title: 'Get Started',
    content: (
      <div className="text-gray-700 space-y-2">
        <p className="font-semibold">To create a New Project</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Go to the Projects tab.</li>
          <li>Tap the New Project button.</li>
          <li>Fill in the project name, description, and select which lists (Material, Cutting, etc.) you want to create.</li>
          <li>You can edit or add more lists later.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'quotes',
    title: 'Quotes',
    content: (
      <div className="text-gray-700 space-y-2">
        <p className="font-semibold">To Generate a Quote:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Go to Quotes and tap New.</li>
            <li>Fill in customer name and email.</li>
            <li>Add item descriptions, quantities, and prices.</li>
            <li>Add labor or transport costs if necessary.</li>
            <li>Select a Payment Term (e.g., Pay within 7 days).</li>
            <li>Add a note (e.g., delivery expectations or warranty).</li>
            <li>Tap Download as PDF or Send via Email.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'material-list',
    title: 'Material List',
    content: (
      <div className="text-gray-700 space-y-2">
        <p className="font-semibold">To Create One:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Tap Purchase List &gt; New</li>
            <li>Add the project name and date.</li>
            <li>Include items (e.g., width, glass, hinges), quantity, and the last known price.</li>
            <li>The app auto-calculates totals.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'cutting-lists',
    title: 'Cutting Lists (C.L. & Glass C.L.)',
    content: (
      <div className="text-gray-700 space-y-2">
        <p className="font-semibold">To Use:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Go to your project.</li>
            <li>Add layout details (material length, repetition, and off-cut info).</li>
            <li>View a visual layout that shows cutting divisions.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'manual-quote-entry',
    title: 'Manual Quote Entry',
    content: (
      <div className="text-gray-700 space-y-2">
        <p className="font-semibold">Here’s how:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Tap New Quote &gt; Manual Entry</li>
            <li>Type in:
                <ul className="list-disc list-inside pl-6">
                    <li>Item Description: e.g., “D/Curve — tempered glass”</li>
                    <li>Qty: e.g., 5</li>
                    <li>Unit Price: e.g., ₦12,000</li>
                </ul>
            </li>
            <li>Amount is calculated automatically.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'need-more-help',
    title: 'Need More Help?',
    content: (
       <div className="text-gray-700">
        <p>Still stuck? Reach out via email us at <a href="mailto:support@workingsapp.com" className="font-semibold text-gray-800 underline">support@workingsapp.com</a>. We're always here to help.</p>
      </div>
    ),
  },
];


const AccordionItem: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className={`w-full flex justify-between items-center py-4 text-left transition-colors duration-200 ${isOpen ? 'text-gray-900' : 'text-gray-700 hover:text-gray-900'}`}
        aria-expanded={isOpen}
      >
        <span className="text-lg font-medium">{title}</span>
        {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-600" /> : <ChevronDownIcon className="w-5 h-5 text-gray-600" />}
      </button>
      {isOpen && (
        <div className="px-5 py-4 mb-4 bg-blue-50 rounded-lg">
          {children}
        </div>
      )}
    </div>
  );
};


const HelpAndTipsScreen: React.FC<HelpAndTipsScreenProps> = ({ onBack }) => {
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const handleToggle = (itemId: string) => {
    setOpenItemId(prevId => (prevId === itemId ? null : itemId));
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
      <header className="p-4 flex items-center gap-4 sticky top-0 z-40 bg-white border-b border-gray-200">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900" aria-label="Go back">
          <ChevronLeftIcon />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Help & Tips</h1>
      </header>

      <main className="flex-1 px-6 overflow-y-auto">
        <div className="py-4">
          {helpTopics.map(topic => (
            <AccordionItem
              key={topic.id}
              title={topic.title}
              isOpen={openItemId === topic.id}
              onToggle={() => handleToggle(topic.id)}
            >
              {topic.content}
            </AccordionItem>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HelpAndTipsScreen;
