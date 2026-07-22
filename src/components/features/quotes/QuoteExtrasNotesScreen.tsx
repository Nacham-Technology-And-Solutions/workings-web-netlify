import React, { useState, useEffect, useMemo } from 'react';
import type { QuoteExtrasNotesData } from '@/types';
import { userService } from '@/services/api';
import { normalizeApiResponse, isApiResponseSuccess, getApiResponseData } from '@/utils/apiResponseHelper';
import { useAuthStore, useTemplateStore, useQuoteStore } from '@/stores';
import { applyMarginToItems } from '@/utils/estimationQuoteMappers';
import {
  computeQuoteTaxAmount,
  quoteTaxChargeLabel,
  type QuoteTaxType,
} from '@/utils/quoteExtrasCalculations';
import PaymentMethodFormModal from '@/components/common/PaymentMethodFormModal';
import type { PaymentMethod } from '@/types/templates';
import { FormattedAmountInput } from '@/components/common/FormattedAmountInput';

interface QuoteExtrasNotesScreenProps {
    onBack: () => void;
    onPreview: (data: QuoteExtrasNotesData) => void;
    onSaveDraft: (data: QuoteExtrasNotesData) => void;
    previousData?: any;
    onNavigate?: (view: string) => void;
    editingQuoteId?: string | null;
    isPreviewLoading?: boolean;
    isSaveDraftLoading?: boolean;
    onNavigateToOverview?: (data: QuoteExtrasNotesData) => void;
    onNavigateToItemList?: (data: QuoteExtrasNotesData) => void;
}

const QuoteExtrasNotesScreen: React.FC<QuoteExtrasNotesScreenProps> = ({
    onBack,
    onPreview,
    onSaveDraft,
    previousData,
    onNavigate,
    editingQuoteId,
    isPreviewLoading = false,
    isSaveDraftLoading = false,
    onNavigateToOverview,
    onNavigateToItemList
}) => {
    const { user } = useAuthStore();
    const { paymentMethods: templatePaymentMethods, getDefaultPaymentMethod, setActiveTab } = useTemplateStore();
    const { estimationDraft, updateEstimationDraftMargin, updateStandaloneQuoteMargin } = useQuoteStore();
    const [extraCharges, setExtraCharges] = useState(previousData?.extrasNotes?.extraCharges || '');
    const [amount, setAmount] = useState(previousData?.extrasNotes?.amount || 0);
    const [additionalNotes, setAdditionalNotes] = useState(previousData?.extrasNotes?.additionalNotes || '');
    const [marginPercent, setMarginPercent] = useState(previousData?.extrasNotes?.marginPercent ?? estimationDraft?.marginPercent ?? 0);
    const [discountPercent, setDiscountPercent] = useState(previousData?.extrasNotes?.discountPercent ?? 0);
    const [taxType, setTaxType] = useState<QuoteTaxType>(
      previousData?.extrasNotes?.taxType ??
        (previousData?.extrasNotes?.tax != null && previousData.extrasNotes.tax > 0 ? 'fixed' : 'fixed')
    );
    const [taxValue, setTaxValue] = useState(
      previousData?.extrasNotes?.taxValue ?? previousData?.extrasNotes?.tax ?? 0
    );
    const [paymentMethods, setPaymentMethods] = useState<Array<{ accountName: string; accountNumber: string; bankName: string }>>([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
    const [accountName, setAccountName] = useState(previousData?.extrasNotes?.accountName || '');
    const [accountNumber, setAccountNumber] = useState(previousData?.extrasNotes?.accountNumber || '');
    const [bankName, setBankName] = useState(previousData?.extrasNotes?.bankName || '');
    const [addedCharges, setAddedCharges] = useState<Array<{ description: string; amount: number }>>(
        previousData?.extrasNotes?.addedCharges ?? []
    );
    const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);
    const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

    const itemsSubtotal = previousData?.itemList?.subtotal ?? 0;

    const discountAmount = useMemo(
        () => (discountPercent > 0 ? Math.round((itemsSubtotal * discountPercent) / 100) : 0),
        [itemsSubtotal, discountPercent]
    );

    const addedChargesTotal = addedCharges.reduce((sum, charge) => sum + charge.amount, 0);

    const taxableBase = itemsSubtotal + addedChargesTotal - discountAmount;

    const taxAmount = useMemo(
        () => computeQuoteTaxAmount(taxType, taxValue, taxableBase),
        [taxType, taxValue, taxableBase]
    );

    const total = useMemo(() => {
        return taxableBase + taxAmount;
    }, [taxableBase, taxAmount]);

    const handleMarginChange = (value: number) => {
        setMarginPercent(value);
        if (estimationDraft?.baseItems?.length) {
            const adjusted = applyMarginToItems(estimationDraft.baseItems, value);
            updateEstimationDraftMargin(value, adjusted);
        } else if (previousData?.itemList?.items?.length) {
            const baseItems = previousData.itemList.baseItems || previousData.itemList.items;
            const adjusted = applyMarginToItems(baseItems, value);
            updateStandaloneQuoteMargin(value, adjusted);
        }
    };

    const buildExtrasData = (): QuoteExtrasNotesData => ({
        extraCharges: addedCharges.map(c => c.description).join(', '),
        amount: addedChargesTotal,
        additionalNotes,
        accountName,
        accountNumber,
        bankName,
        total,
        addedCharges: addedCharges.length > 0 ? addedCharges : undefined,
        marginPercent,
        discountPercent,
        tax: taxAmount,
        taxType,
        taxValue,
    });

    // Apply margin on mount if marginPercent > 0
    useEffect(() => {
        if (marginPercent > 0) {
            if (estimationDraft?.baseItems?.length) {
                const adjusted = applyMarginToItems(estimationDraft.baseItems, marginPercent);
                updateEstimationDraftMargin(marginPercent, adjusted);
            } else if (previousData?.itemList?.items?.length) {
                const baseItems = previousData.itemList.baseItems || previousData.itemList.items;
                const adjusted = applyMarginToItems(baseItems, marginPercent);
                updateStandaloneQuoteMargin(marginPercent, adjusted);
            }
        }
    }, []);

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

                const findMethodIndex = (name: string, number: string) =>
                    allMethods.findIndex((m) => m.accountName === name && m.accountNumber === number);

                // Auto-populate default payment method from template store if available
                const defaultMethod = getDefaultPaymentMethod();
                if (defaultMethod && !previousData?.extrasNotes?.accountName) {
                    setAccountName(defaultMethod.accountName);
                    setAccountNumber(defaultMethod.accountNumber);
                    setBankName(defaultMethod.bankName);
                    const idx = findMethodIndex(defaultMethod.accountName, defaultMethod.accountNumber);
                    setSelectedPaymentMethod(idx >= 0 ? String(idx) : '0');
                } else if (previousData?.extrasNotes?.accountName) {
                    setAccountName(previousData.extrasNotes.accountName);
                    setAccountNumber(previousData.extrasNotes.accountNumber);
                    setBankName(previousData.extrasNotes.bankName);
                    const idx = findMethodIndex(
                        previousData.extrasNotes.accountName,
                        previousData.extrasNotes.accountNumber
                    );
                    setSelectedPaymentMethod(idx >= 0 ? String(idx) : '0');
                } else if (allMethods.length > 0) {
                    setAccountName(allMethods[0].accountName);
                    setAccountNumber(allMethods[0].accountNumber);
                    setBankName(allMethods[0].bankName);
                    setSelectedPaymentMethod('0');
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

    const handlePaymentMethodSaved = (method: PaymentMethod) => {
        handlePaymentMethodChange(method);
    };

    const handleOpenPaymentSettings = () => {
        setActiveTab('paymentMethod');
        onNavigate?.('exportSettings');
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

        const data = buildExtrasData();
        onPreview(data);
    };

    const getExtrasNotesData = (): QuoteExtrasNotesData => buildExtrasData();

    const handleSaveDraft = () => {
        onSaveDraft(getExtrasNotesData());
    };

    const handleNavigateToOverview = () => {
        if (onNavigateToOverview) {
            onNavigateToOverview(getExtrasNotesData());
        } else {
            onBack();
        }
    };

    const handleNavigateToItemList = () => {
        if (onNavigateToItemList) {
            onNavigateToItemList(getExtrasNotesData());
        } else {
            onBack();
        }
    };

    return (
        <div className="flex flex-col h-full min-h-0 bg-white font-sans text-gray-800">
            {/* Header / Breadcrumbs */}
            <div className="px-8 py-6 border-b border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="hidden md:block">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                        <span className="cursor-pointer hover:text-gray-600">Quotes</span>
                        <span>/</span>
                        <span className="cursor-pointer hover:text-gray-600">{editingQuoteId ? 'Edit Quote' : 'Create New Quote'}</span>
                        {editingQuoteId && previousData?.overview?.projectName && previousData?.overview?.quoteId && (
                            <>
                                <span>/</span>
                                <span className="cursor-pointer hover:text-gray-600">
                                    {previousData.overview.projectName} - [{previousData.overview.quoteId}]
                                </span>
                            </>
                        )}
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Extra & Notes</span>
                    </div>
                    </div>

                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <button onClick={handleNavigateToItemList} className="text-gray-600 hover:text-gray-900 mt-1">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                    {editingQuoteId ? 'Edit Quote' : 'Create New Quote'}
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto min-h-0 px-4 md:px-8 py-8 pb-80 lg:pb-8">
                <div className="max-w-7xl mx-auto">
                    {/* Tabs */}
                    <div className="mb-8 border-b border-gray-200">
                        <div className="flex items-center gap-8">
                            <button
                                onClick={handleNavigateToOverview}
                                className="pb-4 px-0 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors relative"
                            >
                                Overview
                            </button>
                            <button
                                onClick={handleNavigateToItemList}
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
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Project extras */}
                            <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-900">Project extras</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className="block text-sm sm:col-span-2">
                                        <span className="text-gray-600">Margin % (max 1,000%)</span>
                                         <input
                                            type="number"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            min={0}
                                            max={1000}
                                            value={marginPercent || ''}
                                            onChange={(e) => {
                                                const raw = parseFloat(e.target.value) || 0;
                                                const val = Math.min(1000, Math.max(0, raw));
                                                handleMarginChange(val);
                                            }}
                                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                        />
                                        <span className="text-xs text-gray-500 mt-1 block">
                                            Built into item prices — not shown separately on the quote.
                                        </span>
                                    </label>
                                    <label className="block text-sm">
                                        <span className="text-gray-600">Discount % (max 100%)</span>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            min={0}
                                            max={100}
                                            value={discountPercent || ''}
                                            onChange={(e) => {
                                                const raw = parseFloat(e.target.value) || 0;
                                                const val = Math.min(100, Math.max(0, raw));
                                                setDiscountPercent(val);
                                            }}
                                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                        />
                                    </label>
                                    <label className="block text-sm sm:col-span-2">
                                        <span className="text-gray-600">Tax</span>
                                        <div className="mt-1 flex flex-col sm:flex-row gap-2">
                                            <select
                                                value={taxType}
                                                onChange={(e) => {
                                                    const newType = e.target.value as QuoteTaxType;
                                                    setTaxType(newType);
                                                    if (newType === 'percent' && taxValue > 100) {
                                                        setTaxValue(100);
                                                    } else if (newType === 'fixed' && taxValue > taxableBase) {
                                                        setTaxValue(Math.max(0, taxableBase));
                                                    }
                                                }}
                                                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                                            >
                                                <option value="fixed">Fixed amount (₦)</option>
                                                <option value="percent">Percentage (%)</option>
                                            </select>
                                            <div className="relative flex-1">
                                                {taxType === 'fixed' ? (
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                                                        <FormattedAmountInput
                                                            value={taxValue || ''}
                                                            onValueChange={(val) => {
                                                                const maxAllowed = Math.max(0, taxableBase);
                                                                setTaxValue(Math.min(maxAllowed, Math.max(0, val)));
                                                            }}
                                                            placeholder="0.00"
                                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={taxValue || ''}
                                                            onChange={(e) => {
                                                                const raw = parseFloat(e.target.value) || 0;
                                                                const val = Math.min(100, Math.max(0, raw));
                                                                setTaxValue(val);
                                                            }}
                                                            placeholder="e.g. 7.5"
                                                            className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {taxAmount > 0 && (
                                            <span className="text-xs text-gray-500 mt-1 block">
                                                Tax on quote: ₦{taxAmount.toLocaleString()}
                                            </span>
                                        )}
                                    </label>
                                </div>
                            </div>

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
                                            <option value="Installation">Installation</option>
                                            <option value="Labor Charge">Labor Charge</option>
                                            <option value="Transport Charge">Transport Charge</option>
                                            <option value="Miscellaneous">Miscellaneous</option>
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
                                        <FormattedAmountInput
                                            value={amount || ''}
                                            onValueChange={(val) => setAmount(val)}
                                            placeholder="0.00"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Add Charge Button */}
                                <button
                                    onClick={handleAddCharge}
                                    disabled={!extraCharges || amount <= 0}
                                    className={`w-full py-2.5 px-4 font-semibold rounded transition-colors ${
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
                                                    const index = parseInt(e.target.value, 10);
                                                    if (!isNaN(index) && paymentMethods[index]) {
                                                        handlePaymentMethodChange(paymentMethods[index]);
                                                        setSelectedPaymentMethod(e.target.value);
                                                    }
                                                }}
                                                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-gray-400"
                                            >
                                                {paymentMethods.map((pm, index) => (
                                                    <option key={index} value={String(index)}>
                                                        {pm.accountName} – {pm.bankName}
                                                        {pm.accountNumber ? ` (••••${pm.accountNumber.slice(-4)})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowAddPaymentModal(true)}
                                            className="text-sm font-semibold text-gray-700 underline hover:text-gray-900"
                                        >
                                            + Add another payment method
                                        </button>

                                        {/* Editable account details for this quote (pre-filled from selection above) */}
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
                                ) : (
                                    <div className="space-y-3">
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <p className="text-sm text-yellow-800 mb-3">
                                                No payment method saved yet. Add one to include bank details on this quote.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setShowAddPaymentModal(true)}
                                                className="text-sm font-semibold text-white bg-gray-900 px-4 py-2 rounded hover:bg-gray-800 transition-colors"
                                            >
                                                Add payment method
                                            </button>
                                            {onNavigate && (
                                                <p className="text-xs text-yellow-700 mt-3">
                                                    Or{' '}
                                                    <button
                                                        type="button"
                                                        onClick={handleOpenPaymentSettings}
                                                        className="underline font-medium hover:text-yellow-900"
                                                    >
                                                        manage payment methods in Settings
                                                    </button>
                                                </p>
                                            )}
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

                            {/* Total — desktop inline */}
                            <div className="hidden lg:block pt-6 border-t border-gray-200 space-y-3">
                                {taxAmount > 0 && (
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>{quoteTaxChargeLabel(taxType, taxValue)}</span>
                                        <span>₦{taxAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                    <span className="text-lg font-semibold text-gray-900">Total</span>
                                    <span className="text-2xl font-bold text-gray-900">₦{total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column — desktop only (mobile uses fixed footer) */}
                        <div className="hidden lg:block space-y-6">
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
                                    disabled={(!accountName || !accountNumber || !bankName) || isPreviewLoading || isSaveDraftLoading}
                                    className={`w-full py-3 font-semibold rounded transition-colors flex items-center justify-center gap-2 ${
                                        accountName && accountNumber && bankName && !isPreviewLoading && !isSaveDraftLoading
                                            ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {isPreviewLoading ? (
                                        <>
                                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
                                            Loading...
                                        </>
                                    ) : (
                                        'Proceed to preview'
                                    )}
                                </button>
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={isSaveDraftLoading || isPreviewLoading}
                                    className={`w-full py-3 font-semibold rounded transition-colors border-2 flex items-center justify-center gap-2 ${
                                        isSaveDraftLoading || isPreviewLoading
                                            ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {isSaveDraftLoading ? (
                                        <>
                                            <span className="inline-block w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" aria-hidden />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save as Draft'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile: fixed total + actions */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
                <div className="px-4 py-3 space-y-1.5 border-b border-gray-100 max-h-32 overflow-y-auto">
                    {addedCharges.map((charge, index) => (
                        <div key={index} className="flex justify-between text-xs text-gray-600">
                            <span>{charge.description}</span>
                            <span>₦{charge.amount.toLocaleString()}</span>
                        </div>
                    ))}
                    {taxAmount > 0 && (
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>{quoteTaxChargeLabel(taxType, taxValue)}</span>
                            <span>₦{taxAmount.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-1">
                        <span className="text-sm font-semibold text-gray-900">Total</span>
                        <span className="text-lg font-bold text-gray-900">₦{total.toLocaleString()}</span>
                    </div>
                </div>
                <div className="px-4 py-3 space-y-2">
                    <button
                        type="button"
                        onClick={handlePreview}
                        disabled={(!accountName || !accountNumber || !bankName) || isPreviewLoading || isSaveDraftLoading}
                        className={`w-full py-3 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                            accountName && accountNumber && bankName && !isPreviewLoading && !isSaveDraftLoading
                                ? 'bg-gray-900 text-white hover:bg-gray-800'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {isPreviewLoading ? (
                            <>
                                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
                                Loading...
                            </>
                        ) : (
                            'Proceed to preview'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSaveDraftLoading || isPreviewLoading}
                        className={`w-full py-2.5 font-semibold rounded-lg transition-colors border-2 flex items-center justify-center gap-2 ${
                            isSaveDraftLoading || isPreviewLoading
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {isSaveDraftLoading ? 'Saving...' : 'Save as Draft'}
                    </button>
                </div>
            </div>

            <PaymentMethodFormModal
                isOpen={showAddPaymentModal}
                onClose={() => setShowAddPaymentModal(false)}
                onSaved={handlePaymentMethodSaved}
            />
        </div>
    );
};

export default QuoteExtrasNotesScreen;
