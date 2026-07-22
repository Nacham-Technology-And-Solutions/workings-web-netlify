import React from 'react';
import { useAuthStore } from '@/stores';
import { getDisplayName } from '@/utils/userHelpers';

interface HomeScreenProps {
    onNewProject: () => void;
    onNavigate?: (view: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNewProject }) => {
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
                        className="mt-6 px-6 py-3 bg-gray-800 text-white text-base font-semibold rounded hover:bg-gray-700 transition-colors"
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
