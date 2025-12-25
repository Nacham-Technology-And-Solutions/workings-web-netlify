import React from 'react';

interface QuoteFinalPreviewScreenProps {
    onBack: () => void;
    onEdit: () => void;
    onDownloadPDF: () => void;
    previousData?: any;
}

const QuoteFinalPreviewScreen: React.FC<QuoteFinalPreviewScreenProps> = ({
    onBack,
    onEdit,
    onDownloadPDF,
    previousData
}) => {
    // Use previousData (generatedQuote) instead of hardcoded sample data
    // Transform the data structure to match what the component expects
    const quoteData = previousData ? {
        quoteId: previousData.quoteId || '#000045',
        issueDate: previousData.issueDate || new Date().toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        }),
        billedTo: previousData.customerName || '',
        email: previousData.customerEmail || '',
        project: previousData.projectName || '',
        location: previousData.siteAddress || '',
        items: previousData.items?.map((item: any) => ({
            description: item.description,
            qty: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
        })) || [],
        subtotal: previousData.summary?.subtotal || 0,
        charges: previousData.summary?.charges || [],
        grandTotal: previousData.summary?.grandTotal || 0,
        paymentInfo: previousData.paymentInfo || {
            accountName: '',
            accountNumber: '',
            bankName: ''
        }
    } : {
        quoteId: '#000045',
        issueDate: new Date().toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        }),
        billedTo: '',
        email: '',
        project: '',
        location: '',
        items: [],
        subtotal: 0,
        charges: [],
        grandTotal: 0,
        paymentInfo: {
            accountName: '',
            accountNumber: '',
            bankName: ''
        }
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
                        <span className="text-gray-900 font-medium">Quote Preview</span>
                    </div>

                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <button onClick={onBack} className="text-gray-600 hover:text-gray-900 mt-1">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">Quote Preview</h1>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onEdit}
                                className="flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Edit
                            </button>
                            <button
                                onClick={onDownloadPDF}
                                className="px-6 py-3 font-semibold rounded-lg transition-colors bg-gray-900 text-white hover:bg-gray-800"
                            >
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-8 py-8 bg-gray-50">
                <div className="max-w-5xl mx-auto">
                    {/* Quote Header Info */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Quote ID:</p>
                                <p className="text-base font-semibold text-gray-900">{quoteData.quoteId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Issue Date:</p>
                                <p className="text-base font-semibold text-gray-900">{quoteData.issueDate}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Billed to:</p>
                                    <p className="text-base font-semibold text-gray-900">{quoteData.billedTo}</p>
                                </div>
                                {quoteData.email && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Email Address:</p>
                                        <p className="text-base font-semibold text-gray-900">{quoteData.email}</p>
                                    </div>
                                )}
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Project:</p>
                                        <p className="text-base font-semibold text-gray-900">{quoteData.project}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Location:</p>
                                        <p className="text-base text-gray-900">{quoteData.location}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Item Lists */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Item Lists</h3>

                                <table className="w-full">
                                    <thead className="border-b border-gray-200">
                                        <tr>
                                            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                            <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {quoteData.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="py-3 text-sm text-gray-900">{item.description || (item as any).description}</td>
                                                <td className="py-3 text-sm text-gray-900">{item.qty || (item as any).quantity}</td>
                                                <td className="py-3 text-sm text-gray-900">₦{(item.unitPrice || (item as any).unitPrice || 0).toLocaleString()}</td>
                                                <td className="py-3 text-sm text-gray-900 text-right font-medium">₦{(item.total || (item as any).total || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right Column - Summary & Payment */}
                        <div className="space-y-6">
                            {/* Summary */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Summary</h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Subtotal</span>
                                        <span className="text-sm font-medium text-gray-900">₦{quoteData.subtotal.toLocaleString()}</span>
                                    </div>
                                    {quoteData.charges && quoteData.charges.length > 0 && quoteData.charges.map((charge, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">{charge.label}</span>
                                            <span className="text-sm font-medium text-gray-900">₦{charge.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="pt-3 border-t border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-semibold text-gray-900">Grand Total</span>
                                            <span className="text-lg font-bold text-gray-900">₦{quoteData.grandTotal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Information */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Payment Information</h3>

                                <div className="space-y-3">
                                    {quoteData.paymentInfo.accountName ? (
                                        <>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Account Name:</p>
                                                <p className="text-sm font-medium text-gray-900">{quoteData.paymentInfo.accountName}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Account Number:</p>
                                                <p className="text-sm font-medium text-gray-900">{quoteData.paymentInfo.accountNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Bank Name:</p>
                                                <p className="text-sm font-medium text-gray-900">{quoteData.paymentInfo.bankName}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No payment information provided</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default QuoteFinalPreviewScreen;
