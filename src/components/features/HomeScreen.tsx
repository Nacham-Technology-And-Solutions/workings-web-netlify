import React, { useState } from 'react';
import { PlusIcon } from '@/assets/icons/IconComponents';
import { useAuthStore } from '@/stores';
import { getDisplayName } from '@/utils/userHelpers';

interface HomeScreenProps {
    onNewProject: () => void;
    onNavigate?: (view: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNewProject, onNavigate }) => {
    const [showTemplateCard, setShowTemplateCard] = useState(true);
    const { user } = useAuthStore();
    const userName = getDisplayName(user?.name, user?.email);

    return (
        <div className="flex-1 relative bg-white">
            <main className="p-6 lg:p-8 xl:p-10 h-full flex flex-col max-w-7xl mx-auto">
                {/* Welcome Message */}
                <div className="mb-6 lg:mb-8">
                    <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 leading-tight">
                        Welcome to Workings, {userName}
                    </h1>
                </div>

                {/* Quick Start with Templates - Call-to-Action Card */}
                {showTemplateCard && (
                    <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 p-5 lg:p-6 bg-blue-50/80 border border-gray-200/80 rounded-xl mb-8">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 017 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                Quick Start with Templates
                            </h3>
                            <p className="text-gray-600 text-sm lg:text-base leading-relaxed mb-4">
                                Choose from our pre-built estimation templates to get started instantly. Save time and ensure accuracy with industry-standard calculations.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => onNavigate?.('templates')}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                                >
                                    Learn More
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTemplateCard(false)}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <button
                                onClick={() => onNavigate?.('templates')}
                                className="px-5 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                See Templates
                            </button>
                        </div>
                    </div>
                )}

                {/* Central content: illustration + CTA text + Create New Project button */}
                <div className="flex-grow flex flex-col items-center justify-center text-center pb-8 lg:pb-12">
                    <img
                        src="/icons/home-screen-icons-start-estimating-now.svg"
                        alt="Start estimating"
                        className="w-48 lg:w-64 xl:w-72 object-contain"
                    />
                    <p className="text-gray-900 font-bold mt-6 text-lg lg:text-xl">
                        Start estimating now!!!
                    </p>
                    <button
                        onClick={onNewProject}
                        className="mt-6 px-6 py-3 bg-gray-800 text-white text-base font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                        aria-label="Create new project"
                    >
                        Create New Project
                    </button>
                </div>
            </main>
        </div>
    );
};

export default HomeScreen;
