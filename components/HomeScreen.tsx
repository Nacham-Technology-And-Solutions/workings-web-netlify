import React, { useState } from 'react';
import { DocumentIcon, CloseIcon, PlusIcon } from './icons/IconComponents';

interface HomeScreenProps {
    onNewProject: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNewProject }) => {
    const [showTemplateCard, setShowTemplateCard] = useState(true);
    const userName = "Barbara";

    return (
        <div className="flex-1 relative bg-white">
            <main className="p-6 lg:p-8 xl:p-10 h-full flex flex-col max-w-7xl lg:mx-auto">
                {/* Welcome Message */}
                <div className="mb-6 lg:mb-8">
                    <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 leading-tight">
                        Welcome to Workings, {userName}!
                    </h1>
                    <p className="hidden lg:block text-gray-600 mt-2 text-lg">
                        Your construction estimation workspace
                    </p>
                </div>

                {/* Desktop: Two-column layout, Mobile: Single column */}
                <div className="lg:grid lg:grid-cols-2 lg:gap-6 xl:gap-8 flex-grow">
                    {/* Left Column - Informational Card */}
                    <div className="lg:flex lg:flex-col">
                {showTemplateCard && (
                            <div className="relative p-5 lg:p-6 xl:p-8 bg-blue-50 rounded-2xl shadow-sm mb-6 lg:mb-0">
                        <button 
                            onClick={() => setShowTemplateCard(false)}
                            className="absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-gray-700 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                            aria-label="Dismiss"
                        >
                            <svg className="w-3 h-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                                <h3 className="hidden lg:block text-xl font-bold text-gray-900 mb-3">
                                    Get Started Quickly
                                </h3>
                                <p className="text-gray-700 text-sm lg:text-base leading-relaxed pr-6 mb-4 lg:mb-6">
                            Start your estimate in seconds with a pre-built template—industry-standard dimensions let you focus on costs, not setup.
                        </p>
                                <button className="px-5 py-2.5 lg:px-6 lg:py-3 bg-gray-800 text-white text-sm lg:text-base font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                            See Templates
                        </button>
                                
                                {/* Desktop: Additional Quick Actions */}
                                <div className="hidden lg:block mt-6 pt-6 border-t border-blue-100">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
                                    <div className="space-y-2">
                                        <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm text-gray-700">
                                            📊 View Recent Projects
                                        </button>
                                        <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm text-gray-700">
                                            📝 Draft Quotes
                                        </button>
                                        <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm text-gray-700">
                                            📋 Material Lists
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Empty State / Illustration */}
                    <div className="flex-grow flex flex-col items-center justify-center text-center pb-24 lg:pb-0">
                    <img 
                        src="/Frame 5.png" 
                        alt="Start estimating" 
                            className="w-48 h-48 lg:w-64 lg:h-64 xl:w-80 xl:h-80 object-contain"
                    />
                        <p className="hidden lg:block text-gray-500 mt-6 text-lg max-w-md">
                            Click the button below to create your first project
                        </p>
                    </div>
                </div>
            </main>
            
            {/* Floating Action Button - Mobile: Fixed, Desktop: Absolute within container */}
            <button 
                onClick={onNewProject}
                className="fixed lg:absolute bottom-8 right-8 lg:bottom-10 lg:right-10 w-16 h-16 lg:w-20 lg:h-20 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-transform transform hover:scale-110 z-10"
                aria-label="Create new project"
            >
                <div className="lg:scale-125">
                <PlusIcon />
                </div>
            </button>
        </div>
    );
};

export default HomeScreen;