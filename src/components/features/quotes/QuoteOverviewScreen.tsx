import React, { useState } from 'react';
import type { QuoteOverviewData } from '@/types';

interface QuoteOverviewScreenProps {
    onBack: () => void;
    onNext: (data: QuoteOverviewData) => void;
    previousData?: any;
}

const QuoteOverviewScreen: React.FC<QuoteOverviewScreenProps> = ({ onBack, onNext, previousData }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'itemList' | 'extras'>('overview');
    const [customerName, setCustomerName] = useState(previousData?.projectDescription?.customerName || 'Olumide Adewale');
    const [projectName, setProjectName] = useState(previousData?.projectDescription?.projectName || 'Olumide Residence Renovation');
    const [siteAddress, setSiteAddress] = useState(previousData?.projectDescription?.siteAddress || 'Lagos Island Apartment Refurbishment');
    const [quoteId] = useState('#000045');
    const [issueDate, setIssueDate] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('');

    const handleNext = () => {
        const data: QuoteOverviewData = {
            customerName,
            projectName,
            siteAddress,
            quoteId,
            issueDate,
            paymentTerms
        };
        onNext(data);
    };

    return (
        <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
            {/* Header / Breadcrumbs */}
            <div className="px-8 py-6 border-b border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                        <span className="cursor-pointer hover:text-gray-600">Projects</span>
                        <span>/</span>
                        <span className="cursor-pointer hover:text-gray-600">Glazing-Type</span>
                        <span>/</span>
                        <span className="cursor-pointer hover:text-gray-600">Create New Quote</span>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Overview</span>
                    </div>

                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <button onClick={onBack} className="text-gray-600 hover:text-gray-900 mt-1">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">Create New Quote</h1>
                            </div>
                        </div>

                        {/* Generate Now Button */}
                        <button
                            onClick={handleNext}
                            className="px-8 py-3 font-semibold rounded-lg transition-colors bg-gray-900 text-white hover:bg-gray-800"
                        >
                            Generate Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Tabs */}
                    <div className="mb-8 border-b border-gray-200">
                        <div className="flex items-center gap-8">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`pb-4 px-0 text-sm font-medium transition-colors relative ${activeTab === 'overview'
                                        ? 'text-gray-900'
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Overview
                                {activeTab === 'overview' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('itemList')}
                                className={`pb-4 px-0 text-sm font-medium transition-colors relative ${activeTab === 'itemList'
                                        ? 'text-gray-900'
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Item List
                                {activeTab === 'itemList' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('extras')}
                                className={`pb-4 px-0 text-sm font-medium transition-colors relative ${activeTab === 'extras'
                                        ? 'text-gray-900'
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Extras & Notes
                                {activeTab === 'extras' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                                )}
                            </button>

                            {/* Filter Button */}
                            <button className="ml-auto pb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
                                <span className="text-sm">Filter</span>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Overview Tab Content */}
                    {activeTab === 'overview' && (
                        <div className="max-w-4xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer's name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Customer's name
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                        />
                                        <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Project name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Project name
                                    </label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                    />
                                </div>

                                {/* Site Address */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Site Address
                                    </label>
                                    <input
                                        type="text"
                                        value={siteAddress}
                                        onChange={(e) => setSiteAddress(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                    />
                                </div>

                                {/* Issue Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Issue Date
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={issueDate}
                                            onChange={(e) => setIssueDate(e.target.value)}
                                            placeholder="Select quote date"
                                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                        />
                                        <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Quote ID */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quote ID
                                    </label>
                                    <input
                                        type="text"
                                        value={quoteId}
                                        readOnly
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 cursor-not-allowed"
                                    />
                                </div>

                                {/* Payment Terms */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Terms
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={paymentTerms}
                                            onChange={(e) => setPaymentTerms(e.target.value)}
                                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-gray-400"
                                        >
                                            <option value="">Select payment terms</option>
                                            <option value="due-on-receipt">Due on Receipt</option>
                                            <option value="net-7">Net 7 (Due 7 days after quote date)</option>
                                            <option value="net-30">Net 30 (Due 30 days after invoice date)</option>
                                            <option value="50-50">50% Deposit, 50% on Completion</option>
                                            <option value="30-70">30% Upfront, 70% on Delivery</option>
                                            <option value="customize">Customize your terms</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Item List Tab Content */}
                    {activeTab === 'itemList' && (
                        <div className="text-center py-12 text-gray-500">
                            <p>Item List content will be displayed here</p>
                        </div>
                    )}

                    {/* Extras & Notes Tab Content */}
                    {activeTab === 'extras' && (
                        <div className="text-center py-12 text-gray-500">
                            <p>Extras & Notes content will be displayed here</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer with Next Button */}
            <div className="border-t border-gray-200 bg-white px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={handleNext}
                        disabled={!paymentTerms}
                        className={`w-full py-4 font-semibold rounded-lg transition-colors ${paymentTerms
                                ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                                : 'bg-gray-400 text-white cursor-not-allowed'
                            }`}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuoteOverviewScreen;
