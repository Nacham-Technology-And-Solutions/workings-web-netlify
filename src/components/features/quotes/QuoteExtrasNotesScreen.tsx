import React, { useState, useEffect } from 'react';
import type { QuoteExtrasNotesData } from '@/types';
import { userService } from '@/services/api';
import { normalizeApiResponse, isApiResponseSuccess, getApiResponseData } from '@/utils/apiResponseHelper';
import { useAuthStore, useTemplateStore } from '@/stores';

interface QuoteExtrasNotesScreenProps {
    onBack: () => void;
    onPreview: (data: QuoteExtrasNotesData) => void;
    onSaveDraft: (data: QuoteExtrasNotesData) => void;
    previousData?: any;
    onNavigate?: (view: string) => void;
}

const QuoteExtrasNotesScreen: React.FC<QuoteExtrasNotesScreenProps> = ({
    onBack,
    onPreview,
    onSaveDraft,
    previousData,
    onNavigate
}) => {
    const { user } = useAuthStore();
    const { paymentMethods: templatePaymentMethods, getDefaultPaymentMethod } = useTemplateStore();
    const [extraCharges, setExtraCharges] = useState(previousData?.extrasNotes?.extraCharges || '');
    const [amount, setAmount] = useState(previousData?.extrasNotes?.amount || 0);
    const [additionalNotes, setAdditionalNotes] = useState(previousData?.extrasNotes?.additionalNotes || '');
    const [paymentMethods, setPaymentMethods] = useState<Array<{ accountName: string; accountNumber: string; bankName: string }>>([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
    const [accountName, setAccountName] = useState(previousData?.extrasNotes?.accountName || '');
    const [accountNumber, setAccountNumber] = useState(previousData?.extrasNotes?.accountNumber || '');
    const [bankName, setBankName] = useState(previousData?.extrasNotes?.bankName || '');
    const [addedCharges, setAddedCharges] = useState<Array<{ description: string; amount: number }>>([]);
    const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);

    // Get subtotal from previous data (Item List)
    const subtotal = previousData?.itemList?.subtotal || 140000;
    const total = subtotal + amount + addedCharges.reduce((sum, charge) => sum + charge.amount, 0);

    // Load payment methods from template store and user profile
    useEffect(() => {
        const loadPaymentMethods = async () => {
            setIsLoadingPaymentMethods(true);
            
            try {
                // First, try to get payment methods from template store
                const templateMethods = templatePaymentMethods.map((pm) => ({
                    accountName: pm.accountName,
                    accountNumber: pm.accountNumber,
                    bankName: pm.bankName,
                }));

                // Also try to get from user profile as fallback
                let userProfileMethods: Array<{ accountName: string; accountNumber: string; bankName: string }> = [];
                if (user?.id) {
                    try {
                        const response = await userService.getProfile(user.id);
                        if (isApiResponseSuccess(response)) {
                            const responseData = getApiResponseData(response) as any;
                            const userProfile = responseData?.user || responseData;
                            if (userProfile.bankDetails) {
                                userProfileMethods = [{
                                    accountName: userProfile.bankDetails.accountName,
                                    accountNumber: userProfile.bankDetails.accountNumber,
                                    bankName: userProfile.bankDetails.bankName,
                                }];
                            }
                        }
                    } catch (error) {
                        console.error('[QuoteExtrasNotesScreen] Error fetching user profile:', error);
                    }
                }

                // Combine template methods and user profile methods (template methods take priority)
                const allMethods = [...templateMethods, ...userProfileMethods];
                setPaymentMethods(allMethods);

                // Auto-populate default payment method from template store if available
                const defaultMethod = getDefaultPaymentMethod();
                if (defaultMethod && !previousData?.extrasNotes?.accountName) {
                    setAccountName(defaultMethod.accountName);
                    setAccountNumber(defaultMethod.accountNumber);
                    setBankName(defaultMethod.bankName);
                    setSelectedPaymentMethod('default');
                } else if (previousData?.extrasNotes?.accountName) {
                    // Use previous data if available
                    setAccountName(previousData.extrasNotes.accountName);
                    setAccountNumber(previousData.extrasNotes.accountNumber);
                    setBankName(previousData.extrasNotes.bankName);
                } else if (allMethods.length > 0 && !defaultMethod) {
                    // If no default but methods exist, use first one
                    setAccountName(allMethods[0].accountName);
                    setAccountNumber(allMethods[0].accountNumber);
                    setBankName(allMethods[0].bankName);
                    setSelectedPaymentMethod('default');
                }
            } catch (error: any) {
                console.error('[QuoteExtrasNotesScreen] Error loading payment methods:', error);
            } finally {
                setIsLoadingPaymentMethods(false);
            }
        };

        loadPaymentMethods();
    }, [user?.id, previousData, templatePaymentMethods, getDefaultPaymentMethod]);

    // Handle payment method selection
    const handlePaymentMethodChange = (method: { accountName: string; accountNumber: string; bankName: string }) => {
        setAccountName(method.accountName);
        setAccountNumber(method.accountNumber);
        setBankName(method.bankName);
    };

    const handleAddCharge = () => {
        if (extraCharges && amount > 0) {
            setAddedCharges([...addedCharges, { description: extraCharges, amount }]);
            setExtraCharges('');
            setAmount(0);
        }
    };

    const handleRemoveCharge = (index: number) => {
        setAddedCharges(addedCharges.filter((_, i) => i !== index));
    };

    const handlePreview = () => {
        // Validate that account details are provided
        if (!accountName || !accountNumber || !bankName) {
            alert('Please provide account details (Account Name, Account Number, and Bank Name) before proceeding to preview.');
            return;
        }

        const data: QuoteExtrasNotesData = {
            extraCharges: addedCharges.map(c => c.description).join(', '),
            amount: addedCharges.reduce((sum, c) => sum + c.amount, 0),
            additionalNotes,
            accountName,
            accountNumber,
            bankName,
            total,
            addedCharges: addedCharges.length > 0 ? addedCharges : undefined
        };
        onPreview(data);
    };

    const handleSaveDraft = () => {
        const data: QuoteExtrasNotesData = {
            extraCharges: addedCharges.map(c => c.description).join(', '),
            amount: addedCharges.reduce((sum, c) => sum + c.amount, 0),
            additionalNotes,
            accountName,
            accountNumber,
            bankName,
            total,
            addedCharges: addedCharges.length > 0 ? addedCharges : undefined
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
                            {/* Extra Charges Section */}
                            <div className="space-y-4">
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
                                            <option value="Freight Charges">Freight Charges</option>
                                            <option value="Transportation Fee">Transportation Fee</option>
                                            <option value="Installation">Installation</option>
                                            <option value="Labor Charge">Labor Charge</option>
                                            <option value="Transport Charge">Transport Charge</option>
                                            <option value="Other">Other</option>
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

                                {/* Add Charge Button */}
                                <button
                                    onClick={handleAddCharge}
                                    disabled={!extraCharges || amount <= 0}
                                    className={`w-full py-2.5 px-4 font-semibold rounded-lg transition-colors ${
                                        extraCharges && amount > 0
                                            ? 'bg-gray-900 text-white hover:bg-gray-800'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    Add Charge
                                </button>

                                {/* Added Charges List */}
                                {addedCharges.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Added Charges:</p>
                                        {addedCharges.map((charge, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{charge.description}</p>
                                                    <p className="text-xs text-gray-600">₦{charge.amount.toLocaleString()}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveCharge(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Remove"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="pt-6">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Payment Method</h3>

                                {isLoadingPaymentMethods ? (
                                    <div className="text-sm text-gray-500 py-4">Loading payment methods...</div>
                                ) : paymentMethods.length > 0 ? (
                                    <div className="space-y-4">
                                        {/* Payment Method Selector */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Select Payment Method
                                            </label>
                                            <select
                                                value={selectedPaymentMethod}
                                                onChange={(e) => {
                                                    if (e.target.value === 'default' && paymentMethods[0]) {
                                                        handlePaymentMethodChange(paymentMethods[0]);
                                                        setSelectedPaymentMethod('default');
                                                    }
                                                }}
                                                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-gray-400"
                                            >
                                                <option value="default">Default Payment Method</option>
                                                {/* Future: Add more payment methods here */}
                                            </select>
                                        </div>

                                        {/* Payment Details Display */}
                                        <div className="space-y-3 pt-2">
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
                                ) : (
                                    <div className="space-y-3">
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <p className="text-sm text-yellow-800 mb-2">
                                                No payment method configured. Please configure your payment details in Settings.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    if (onNavigate) {
                                                        onNavigate('templates');
                                                    }
                                                }}
                                                className="text-sm text-yellow-900 font-semibold underline hover:text-yellow-700"
                                            >
                                                Go to Settings
                                            </button>
                                        </div>
                                        {/* Allow manual entry if no payment method */}
                                        <div className="space-y-3 pt-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Account Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={accountName}
                                                    onChange={(e) => setAccountName(e.target.value)}
                                                    placeholder="Enter account name"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Account Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={accountNumber}
                                                    onChange={(e) => setAccountNumber(e.target.value)}
                                                    placeholder="Enter account number"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Bank Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={bankName}
                                                    onChange={(e) => setBankName(e.target.value)}
                                                    placeholder="Enter bank name"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                    disabled={!accountName || !accountNumber || !bankName}
                                    className={`w-full py-3 font-semibold rounded-lg transition-colors ${
                                        accountName && accountNumber && bankName
                                            ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
