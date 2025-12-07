import React, { useState } from 'react';
import type { QuoteExtrasNotesData } from '@/types';

interface QuoteExtrasNotesScreenProps {
    onBack: () => void;
    onPreview: (data: QuoteExtrasNotesData) => void;
    onSaveDraft: (data: QuoteExtrasNotesData) => void;
    previousData?: any;
}

const QuoteExtrasNotesScreen: React.FC<QuoteExtrasNotesScreenProps> = ({
    onBack,
    onPreview,
    onSaveDraft,
    previousData
}) => {
    const [extraCharges, setExtraCharges] = useState('');
    const [amount, setAmount] = useState(0);
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [accountName] = useState('Olumide Adewale');
    const [accountNumber] = useState('10-4030-011094');
    const [bankName] = useState('Zenith Bank');

    // Get subtotal from previous data (Item List)
    const subtotal = 140000; // This should come from previousData
    const total = subtotal + amount;

    const handlePreview = () => {
        const data: QuoteExtrasNotesData = {
            extraCharges,
            amount,
            additionalNotes,
            accountName,
            accountNumber,
            bankName,
            total
        };
        onPreview(data);
    };

    const handleSaveDraft = () => {
        const data: QuoteExtrasNotesData = {
            extraCharges,
            amount,
            additionalNotes,
            accountName,
            accountNumber,
            bankName,
            total
        };
        onSaveDraft(data);
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
                        <span className="text-gray-900 font-medium">Extra & Notes</span>
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
                                onClick={onBack}
                                className="pb-4 px-0 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors relative"
                            >
                                Overview
                            </button>
                            <button
                                onClick={onBack}
                                className="pb-4 px-0 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors relative"
                            >
                                Item List
                            </button>
                            <button
                                className="pb-4 px-0 text-sm font-medium text-gray-900 transition-colors relative"
                            >
                                Extras & Notes
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Extra Charges */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select extra charges for project
                                </label>
                                <div className="relative">
                                    <select
                                        value={extraCharges}
                                        onChange={(e) => setExtraCharges(e.target.value)}
                                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-gray-400"
                                    >
                                        <option value="">Select extra charges for project</option>
                                        <option value="freight">Freight Charges</option>
                                        <option value="transportation">Transportation</option>
                                        <option value="installation">Installation</option>
                                        <option value="labor">Labor</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">₦</span>
                                    <input
                                        type="number"
                                        value={amount || ''}
                                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                    />
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="pt-6">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Payment Method</h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-gray-600">Account Name:</span>
                                        <span className="text-sm text-gray-900 font-medium">{accountName}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-gray-600">Account Number:</span>
                                        <span className="text-sm text-gray-900 font-medium">{accountNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-gray-600">Bank Name:</span>
                                        <span className="text-sm text-gray-900 font-medium">{bankName}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="pt-6 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-gray-900">Total</span>
                                    <span className="text-2xl font-bold text-gray-900">₦{total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Additional Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 uppercase mb-2">
                                    Additional Notes
                                </label>
                                <textarea
                                    value={additionalNotes}
                                    onChange={(e) => setAdditionalNotes(e.target.value)}
                                    placeholder="Enter some additional notes here....."
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3 pt-4">
                                <button
                                    onClick={handlePreview}
                                    disabled={!extraCharges}
                                    className={`w-full py-3 font-semibold rounded-lg transition-colors ${extraCharges
                                            ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                                            : 'bg-gray-400 text-white cursor-not-allowed'
                                        }`}
                                >
                                    Proceed to preview
                                </button>
                                <button
                                    onClick={handleSaveDraft}
                                    className="w-full py-3 font-semibold rounded-lg transition-colors border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    Save as Draft
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default QuoteExtrasNotesScreen;
