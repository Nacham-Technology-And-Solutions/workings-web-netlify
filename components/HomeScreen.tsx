import React, { useState } from 'react';
import { DocumentIcon, CloseIcon, PlusIcon } from './icons/IconComponents';

interface HomeScreenProps {
    onNewProject: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNewProject }) => {
    const [showTemplateCard, setShowTemplateCard] = useState(true);
    const userName = "Barbara"; // Hardcoded for now

    return (
        <div className="flex-1 relative bg-gray-50">
            <main className="p-6 h-full flex flex-col">
                <h1 className="text-3xl font-bold text-gray-800">
                    Welcome to Workings, {userName}!
                </h1>

                {showTemplateCard && (
                    <div className="relative mt-6 p-5 bg-sky-100/70 border border-sky-200 rounded-xl shadow-sm">
                        <button 
                            onClick={() => setShowTemplateCard(false)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                            aria-label="Dismiss"
                        >
                            <CloseIcon />
                        </button>
                        <p className="text-gray-700 max-w-md">
                            Start your estimate in seconds with a pre-built template—industry-standard dimensions let you focus on costs, not setup.
                        </p>
                        <button className="mt-4 px-5 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                            See Templates
                        </button>
                    </div>
                )}

                <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 pb-16">
                    <DocumentIcon />
                    <p className="mt-4 text-lg">Start estimating now!!!</p>
                </div>
            </main>
            
            <button 
                onClick={onNewProject}
                className="fixed bottom-8 right-8 w-16 h-16 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-transform transform hover:scale-110"
                aria-label="Create new project"
            >
                <PlusIcon />
            </button>
        </div>
    );
};

export default HomeScreen;