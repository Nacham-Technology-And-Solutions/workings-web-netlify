
import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ShoppingBagIcon, PlusIcon } from './icons/IconComponents';
import { sampleMaterialLists } from '../constants';
import type { MaterialList, MaterialListStatus } from '../types';

interface MaterialListScreenProps {
  onBack: () => void;
  onViewList: (listId: string) => void;
  onCreateNewList: () => void;
}

const statusStyles: Record<MaterialListStatus, string> = {
  Draft: 'bg-gray-200 text-gray-800',
  Completed: 'bg-green-100 text-green-800',
};

const MaterialCard: React.FC<{ list: MaterialList; onClick: () => void }> = ({ list, onClick }) => {
  const { projectName, listNumber, status, issueDate } = list;
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(issueDate));

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-2"
    >
      <h2 className="text-lg font-semibold text-gray-900 pr-4">{projectName}</h2>
      <div className="flex items-center text-sm text-gray-500">
        <span>{formattedDate}</span>
        <span className="mx-2">•</span>
        <span>{listNumber}</span>
      </div>
      <div>
        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${statusStyles[status]}`}>
          {status}
        </span>
      </div>
    </button>
  );
};

const MaterialListScreen: React.FC<MaterialListScreenProps> = ({ onBack, onViewList, onCreateNewList }) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Draft'>('All');
  const [materialLists] = useState<MaterialList[]>(sampleMaterialLists);

  const filteredLists = useMemo(() => {
    if (activeTab === 'All') {
      return materialLists;
    }
    return materialLists.filter(list => list.status === 'Draft');
  }, [activeTab, materialLists]);
  
  const emptyStateMessages = {
    All: {
      message: 'No purchase lists yet. Create one now.',
    },
    Draft: {
      message: 'No draft purchase lists. Start a new draft now.',
    },
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-800">
      <header className="p-4 flex items-center gap-4 sticky top-0 z-40 bg-white border-b border-gray-200">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900" aria-label="Go back">
          <ChevronLeftIcon />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Material List</h1>
      </header>

      <div className="p-4 bg-white border-b border-gray-200">
        <div className="bg-gray-100 p-1 rounded-full flex items-center">
          <button
            onClick={() => setActiveTab('All')}
            className={`w-1/2 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 ${
              activeTab === 'All' ? 'bg-gray-800 text-white shadow' : 'text-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('Draft')}
            className={`w-1/2 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 ${
              activeTab === 'Draft' ? 'bg-gray-800 text-white shadow' : 'text-gray-600'
            }`}
          >
            Draft
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4">
        {filteredLists.length > 0 ? (
          <div className="space-y-4 pb-24">
            {filteredLists.map(list => (
              <MaterialCard key={list.id} list={list} onClick={() => onViewList(list.id)} />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <ShoppingBagIcon className="mb-4" />
            <p className="max-w-xs mx-auto mb-6 text-gray-500">
              {emptyStateMessages[activeTab].message}
            </p>
            <button
              onClick={onCreateNewList}
              className="px-6 py-3 bg-gray-800 text-white text-base font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
            >
              Generate List
            </button>
          </div>
        )}
      </main>

      <button
        onClick={onCreateNewList}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-transform transform hover:scale-110"
        aria-label="Create new material list"
      >
        <PlusIcon />
      </button>
    </div>
  );
};

export default MaterialListScreen;
