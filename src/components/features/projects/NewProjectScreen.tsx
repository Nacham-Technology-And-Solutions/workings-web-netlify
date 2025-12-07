import React, { useState, useMemo, useRef, useEffect } from 'react';
import { formatNaira } from '@/utils/formatters';
import Input from '@/components/common/Input';
import {
    ChevronLeftIcon,
    UserIcon,
    CalendarIcon,
    PlusCircleIcon,
    TrashIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@/assets/icons/IconComponents';
import CalendarModal from '@/components/common/CalendarModal';
import AddItemsModal from '@/components/common/AddItemsModal';
import DimensionInputModal from '@/components/common/DimensionInputModal';
import { QuoteItem, QuotePreviewData } from '@/types';

interface NewProjectScreenProps {
    onBack: () => void;
    onGenerateQuote: (quoteData: QuotePreviewData) => void;
}


const NewProjectScreen: React.FC<NewProjectScreenProps> = ({ onBack, onGenerateQuote }) => {
    const [quoteTab, setQuoteTab] = useState<'Overview' | 'Item-List' | 'Extras & Notes'>('Overview');
    const [itemView, setItemView] = useState<'edit' | 'review'>('edit');

    // Form State
    const [customerName, setCustomerName] = useState('Samantha Green');
    const [customerEmail, setCustomerEmail] = useState('samanthagreen@example.com');
    const [projectName, setProjectName] = useState('Kitchen Window Refurbishment');
    const [siteAddress, setSiteAddress] = useState('123 Banana Street, Lagos, Nigeria');
    const [issueDate, setIssueDate] = useState<Date | null>(new Date(Date.UTC(2025, 5, 18))); // June is 5 (0-indexed)
    const [quoteId] = useState('#000047'); // From image, read-only
    const [items, setItems] = useState<Omit<QuoteItem, 'total'>[]>(
        [{ id: `item-${Date.now()}`, description: 'Cement Bag', quantity: 20, unitPrice: 5000 }]
    );
    const [extraCharge, setExtraCharge] = useState({ type: '', amount: '' });
    const [additionalNotes, setAdditionalNotes] = useState('');

    // Modal & UI State
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isAddItemsModalOpen, setIsAddItemsModalOpen] = useState(false);
    const [isDimensionModalOpen, setIsDimensionModalOpen] = useState(false);
    const [selectedList, setSelectedList] = useState<'dimension' | 'material'>('material');
    const [isChargesDropdownOpen, setIsChargesDropdownOpen] = useState(false);
    const [editingDimension, setEditingDimension] = useState<Omit<QuoteItem, 'total'> | null>(null);
    const chargesDropdownRef = useRef<HTMLDivElement>(null);

    const chargeOptions = [
        'Freight Charges',
        'Transportation & Delivery',
        'Installation Fee',
        'Contingency (e.g. 5%)',
        'Value Added Tax (VAT)',
        'Customize your terms',
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (chargesDropdownRef.current && !chargesDropdownRef.current.contains(event.target as Node)) {
                setIsChargesDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => {
            if (item.type === 'dimension' && item.width && item.height) {
                // For dimension items: (width * height in mm²) / 1,000,000 * quantity * unitPrice
                return sum + ((item.width * item.height) / 1000000 * item.quantity * item.unitPrice);
            }
            // For material items: quantity * unitPrice
            return sum + (item.quantity * item.unitPrice);
        }, 0);
    }, [items]);

    const quoteTotal = useMemo(() => {
        const extraAmount = parseFloat(extraCharge.amount) || 0;
        return subtotal + extraAmount;
    }, [subtotal, extraCharge.amount]);

    const getDayWithSuffix = (day: number) => {
        if (day > 3 && day < 21) return day + 'th';
        switch (day % 10) {
            case 1: return day + "st";
            case 2: return day + "nd";
            case 3: return day + "rd";
            default: return day + "th";
        }
    };

    const formatDisplayDate = (date: Date | null): string => {
        if (!date) return '';
        const day = date.getUTCDate(); // Use UTC date to avoid timezone issues
        const month = date.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
        const year = date.getUTCFullYear();
        return `${getDayWithSuffix(day)} ${month}, ${year}.`;
    };

    const handleTabChange = (tab: 'Overview' | 'Item-List' | 'Extras & Notes') => {
        if (quoteTab === 'Item-List' && tab !== 'Item-List') {
            setItemView('edit');
        }
        setQuoteTab(tab);
    };

    const handleItemChange = (index: number, field: 'description' | 'quantity' | 'unitPrice', value: string) => {
        const newItems = [...items];
        const item = { ...newItems[index] };

        if (field === 'description') {
            item.description = value;
        } else {
            // Allow empty string for temporary clearing of input
            const numValue = value === '' ? 0 : parseFloat(value.replace(/,/g, ''));
            if (!isNaN(numValue)) {
                if (field === 'quantity') {
                    item.quantity = numValue;
                } else if (field === 'unitPrice') {
                    item.unitPrice = numValue;
                }
            }
        }
        newItems[index] = item;
        setItems(newItems);
    };

    const addItem = () => {
        if (selectedList === 'dimension') {
            setIsDimensionModalOpen(true);
        } else {
            setItems([...items, { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, type: 'material' }]);
        }
    };

    const removeItem = (indexToRemove: number) => {
        setItems(items.filter((_, index) => index !== indexToRemove));
    };

    const handleAddDimension = (dimensionData: Omit<QuoteItem, 'total' | 'id'>) => {
        const newDimension: Omit<QuoteItem, 'total'> = {
            id: editingDimension?.id || `dim-${Date.now()}`,
            ...dimensionData
        };

        if (editingDimension) {
            // Update existing dimension
            const updatedItems = items.map(item =>
                item.id === editingDimension.id ? newDimension : item
            );
            setItems(updatedItems);
            setEditingDimension(null);
        } else {
            // Add new dimension
            setItems([...items, newDimension]);
        }
        setIsDimensionModalOpen(false);
    };

    const handleEditDimension = (item: Omit<QuoteItem, 'total'>) => {
        setEditingDimension(item);
        setIsDimensionModalOpen(true);
    };

    const handleFinalGenerateQuote = () => {
        const charges = [];
        if (extraCharge.type && extraCharge.amount) {
            charges.push({ label: extraCharge.type, amount: parseFloat(extraCharge.amount) });
        }

        const quoteData: QuotePreviewData = {
            projectName: projectName || "Unnamed Project",
            siteAddress: siteAddress || "N/A",
            customerName: customerName || "N/A",
            customerEmail: customerEmail || "N/A",
            quoteId: quoteId,
            issueDate: formatDisplayDate(issueDate) || 'N/A',
            items: items.map(item => ({ ...item, total: item.quantity * item.unitPrice })),
            summary: {
                subtotal: subtotal,
                charges: charges,
                grandTotal: quoteTotal
            },
            paymentInfo: {
                accountName: 'Olumide Adewale',
                accountNumber: '10-4030-011094',
                bankName: 'Zenith Bank'
            }
        };
        onGenerateQuote(quoteData);
    };

    const renderOverview = () => (
        <div className="pt-6 space-y-8">
            <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">CUSTOMERS' INFORMATION</h3>
                <div className="border-b-2 border-dashed border-gray-300 mb-4"></div>
                <div className="space-y-4">
                    <Input
                        id="quoteCustomerName"
                        label="Customer's name"
                        placeholder="Select a name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        rightIcon={<UserIcon className="text-gray-500" />}
                    />
                    <Input
                        id="quoteCustomerEmail"
                        label="Customer's email address"
                        type="email"
                        placeholder="samanthagreen@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                </div>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">QUOTE DETAILS</h3>
                <div className="border-b-2 border-dashed border-gray-300 mb-4"></div>
                <div className="space-y-4">
                    <Input
                        id="quoteProjectName"
                        label="Project name"
                        placeholder="Enter a project name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                    />
                    <Input
                        id="quoteSiteAddress"
                        label="Site Address"
                        placeholder="Enter site address eg- Doom Refurbishments..."
                        value={siteAddress}
                        onChange={(e) => setSiteAddress(e.target.value)}
                    />
                    <div onClick={() => setIsCalendarOpen(true)} className="cursor-pointer">
                        <Input
                            id="issueDate"
                            label="Issue Date"
                            value={formatDisplayDate(issueDate)}
                            placeholder="Select quote date"
                            readOnly
                            rightIcon={<CalendarIcon className="text-gray-500" />}
                            className="pointer-events-none"
                        />
                    </div>
                    <Input
                        id="quoteId"
                        label="Quote ID"
                        value={quoteId}
                        readOnly
                        className="bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                    />
                </div>
            </div>
        </div>
    );

    const renderItemListEdit = () => {
        const filteredItems = items.filter(item => {
            if (selectedList === 'dimension') {
                return item.type === 'dimension';
            } else {
                return !item.type || item.type === 'material';
            }
        });

        return (
            <div className="pt-6 pb-24">
                {/* Toggle between Material List and Dimension List */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">ITEM LISTS</h3>
                    <div className="bg-gray-100 rounded-full p-1 flex items-center gap-1">
                        <button
                            onClick={() => setSelectedList('material')}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${selectedList === 'material'
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Material
                        </button>
                        <button
                            onClick={() => setSelectedList('dimension')}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${selectedList === 'dimension'
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Dimension
                        </button>
                    </div>
                </div>
                <div className="border-b-2 border-dashed border-gray-300 mb-6"></div>

                {/* Item Table */}
                <div className="w-full">
                    {selectedList === 'dimension' ? (
                        <>
                            {/* Dimension Table Header */}
                            <div className="grid grid-cols-12 gap-x-2 text-xs font-medium text-gray-500 pb-2 border-b border-gray-200">
                                <div className="col-span-3">Description</div>
                                <div className="col-span-2 text-center">Dimension</div>
                                <div className="col-span-2 text-center">Qty</div>
                                <div className="col-span-2 text-right">Price(₦)</div>
                                <div className="col-span-3 text-right">Total(₦)</div>
                            </div>

                            {/* Dimension Table Body */}
                            <div className="mt-1">
                                {filteredItems.map((item, index) => {
                                    const itemTotal = (item.width || 0) * (item.height || 0) * item.quantity * item.unitPrice / 1000000; // Convert mm² to m²
                                    return (
                                        <div key={item.id} className="grid grid-cols-12 gap-x-2 items-center py-3 border-b border-gray-200 group">
                                            <div className="col-span-3">
                                                <span className="text-sm text-gray-800 font-medium">{item.description}</span>
                                            </div>
                                            <div className="col-span-2 text-center">
                                                <span className="text-xs text-gray-600">{item.width}×{item.height}</span>
                                            </div>
                                            <div className="col-span-2 text-center">
                                                <span className="text-sm text-gray-600">{item.quantity}</span>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <span className="text-sm text-gray-600">{item.unitPrice.toLocaleString('en-US')}</span>
                                            </div>
                                            <div className="col-span-3 flex items-center justify-end gap-2">
                                                <span className="text-sm font-semibold text-gray-800 text-right">
                                                    {itemTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                                </span>
                                                <button
                                                    onClick={() => handleEditDimension(item)}
                                                    aria-label="Edit dimension"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => removeItem(items.indexOf(item))}
                                                    aria-label="Remove item"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Material Table Header */}
                            <div className="grid grid-cols-12 gap-x-4 text-xs font-medium text-gray-500 pb-2 border-b border-gray-200">
                                <div className="col-span-5">Description</div>
                                <div className="col-span-2">Qty</div>
                                <div className="col-span-2 text-right">Unit Price(₦)</div>
                                <div className="col-span-3 text-right">Total(₦)</div>
                            </div>

                            {/* Material Table Body */}
                            <div className="mt-1">
                                {filteredItems.map((item, index) => {
                                    const actualIndex = items.findIndex(i => i.id === item.id);
                                    return (
                                        <div key={item.id} className="grid grid-cols-12 gap-x-4 items-center py-2 border-b border-gray-200 group">
                                            <div className="col-span-5">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(actualIndex, 'description', e.target.value)}
                                                    placeholder="Item Description"
                                                    className="w-full bg-transparent p-0 focus:outline-none text-sm text-gray-800 font-medium"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    value={item.quantity || ''}
                                                    onChange={(e) => handleItemChange(actualIndex, 'quantity', e.target.value)}
                                                    className="w-full bg-transparent p-0 focus:outline-none text-sm text-gray-600 text-left"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="text"
                                                    value={item.unitPrice ? item.unitPrice.toLocaleString('en-US') : ''}
                                                    onChange={(e) => handleItemChange(actualIndex, 'unitPrice', e.target.value)}
                                                    className="w-full bg-transparent p-0 focus:outline-none text-sm text-gray-600 text-right"
                                                />
                                            </div>
                                            <div className="col-span-3 flex items-center justify-end gap-2">
                                                <span className="text-sm font-semibold text-gray-800 text-right">
                                                    {(item.quantity * item.unitPrice).toLocaleString('en-US')}
                                                </span>
                                                {filteredItems.length > 1 && (
                                                    <button onClick={() => removeItem(actualIndex)} aria-label="Remove item" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                <button onClick={addItem} className="w-full flex items-center justify-center gap-2 py-3 mt-6 text-cyan-600 font-semibold border border-cyan-500 rounded-lg hover:bg-cyan-50 transition-colors">
                    <span>{selectedList === 'dimension' ? 'Add a dimension' : 'Add an item'}</span>
                    <PlusCircleIcon className="text-cyan-600 w-5 h-5" />
                </button>

                <div className="mt-8 py-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-800 font-semibold">Subtotal</span>
                        <span className="text-gray-900 font-bold">{formatNaira(subtotal)}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderItemListReview = () => {
        const filteredItems = items.filter(item => {
            if (selectedList === 'dimension') {
                return item.type === 'dimension';
            } else {
                return !item.type || item.type === 'material';
            }
        });

        return (
            <div className="pt-6 pb-24">
                {/* Toggle between Material List and Dimension List */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">ITEM LISTS</h3>
                    <div className="bg-gray-100 rounded-full p-1 flex items-center gap-1">
                        <button
                            onClick={() => setSelectedList('material')}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${selectedList === 'material'
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Material
                        </button>
                        <button
                            onClick={() => setSelectedList('dimension')}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${selectedList === 'dimension'
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Dimension
                        </button>
                    </div>
                </div>
                <div className="border-b-2 border-dashed border-gray-300 mb-6"></div>

                {/* Item Table */}
                <div className="w-full">
                    {selectedList === 'dimension' ? (
                        <>
                            {/* Dimension Table Header */}
                            <div className="grid grid-cols-12 gap-x-2 text-sm font-medium text-gray-500 pb-2 border-b border-gray-300">
                                <div className="col-span-3">Description</div>
                                <div className="col-span-2 text-center">Dimension</div>
                                <div className="col-span-2 text-center">Qty</div>
                                <div className="col-span-2 text-right">Price(₦)</div>
                                <div className="col-span-3 text-right">Total(₦)</div>
                            </div>

                            {/* Dimension Table Body */}
                            <div className="mt-1">
                                {filteredItems.map((item) => {
                                    const itemTotal = (item.width || 0) * (item.height || 0) * item.quantity * item.unitPrice / 1000000;
                                    return (
                                        <div key={item.id} className="grid grid-cols-12 gap-x-2 items-center py-3 border-b border-gray-200">
                                            <div className="col-span-3 text-base text-gray-800 font-medium">
                                                {item.description || '-'}
                                            </div>
                                            <div className="col-span-2 text-sm text-gray-600 text-center">
                                                {item.width}×{item.height}
                                            </div>
                                            <div className="col-span-2 text-base text-gray-600 text-center">
                                                {item.quantity}
                                            </div>
                                            <div className="col-span-2 text-base text-gray-600 text-right">
                                                {item.unitPrice.toLocaleString('en-US')}
                                            </div>
                                            <div className="col-span-3 text-base font-semibold text-gray-800 text-right">
                                                {itemTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Material Table Header */}
                            <div className="grid grid-cols-12 gap-x-4 text-sm font-medium text-gray-500 pb-2 border-b border-gray-300">
                                <div className="col-span-5">Description</div>
                                <div className="col-span-2">Qty</div>
                                <div className="col-span-3 text-right">Unit Price(₦)</div>
                                <div className="col-span-2 text-right">Total(₦)</div>
                            </div>

                            {/* Material Table Body */}
                            <div className="mt-1">
                                {filteredItems.map((item) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-x-4 items-center py-3 border-b border-gray-200">
                                        <div className="col-span-5 text-base text-gray-800 font-medium break-words">
                                            {item.description || '-'}
                                        </div>
                                        <div className="col-span-2 text-base text-gray-600 text-left">
                                            {item.quantity}
                                        </div>
                                        <div className="col-span-3 text-base text-gray-600 text-right">
                                            {item.unitPrice.toLocaleString('en-US')}
                                        </div>
                                        <div className="col-span-2 text-base font-semibold text-gray-800 text-right">
                                            {(item.quantity * item.unitPrice).toLocaleString('en-US')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={() => { addItem(); setItemView('edit'); }}
                    className="w-full flex items-center justify-center gap-2 py-3 mt-6 text-cyan-600 font-semibold border border-cyan-500 rounded-lg hover:bg-cyan-50 transition-colors"
                >
                    <span>{selectedList === 'dimension' ? 'Add a dimension' : 'Add an item'}</span>
                    <PlusCircleIcon className="text-cyan-600 w-5 h-5" />
                </button>

                <div className="mt-8 py-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-800 font-semibold">Subtotal</span>
                        <span className="text-gray-900 font-bold">{formatNaira(subtotal)}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderExtrasAndNotes = () => (
        <div className="space-y-8 pt-6 pb-24">
            <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">EXTRA CHARGES</h3>
                <div className="border-b-2 border-dashed border-gray-300 mb-4"></div>
                <div className="space-y-4">
                    <div className="relative" ref={chargesDropdownRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Charge Name
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsChargesDropdownOpen(!isChargesDropdownOpen)}
                            className="w-full flex justify-between items-center px-4 py-3.5 text-left bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
                        >
                            <span className={extraCharge.type ? 'text-gray-900' : 'text-gray-400'}>
                                {extraCharge.type || 'Select extra charges for project'}
                            </span>
                            {isChargesDropdownOpen ? <ChevronUpIcon className="text-gray-500" /> : <ChevronDownIcon className="text-gray-500" />}
                        </button>
                        {isChargesDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
                                <ul className="py-1 max-h-60 overflow-y-auto">
                                    {chargeOptions.map(option => (
                                        <li
                                            key={option}
                                            onClick={() => {
                                                setExtraCharge(p => ({ ...p, type: option }));
                                                setIsChargesDropdownOpen(false);
                                            }}
                                            className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
                                        >
                                            {option}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="extraChargesAmount" className="block text-sm font-medium text-gray-700 mb-1">
                            Amount
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                            <input
                                id="extraChargesAmount"
                                type="text"
                                placeholder="0.00"
                                value={extraCharge.amount ? parseFloat(extraCharge.amount).toLocaleString('en-US') : ''}
                                onChange={(e) => setExtraCharge(p => ({ ...p, amount: e.target.value.replace(/[^0-9.]/g, '') }))}
                                className="w-full pl-8 pr-4 py-3.5 text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">PAYMENT METHOD</h3>
                <div className="space-y-3 text-base">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Account Name:</span>
                        <span className="font-medium text-gray-800">Olumide Adewale</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Account Number:</span>
                        <span className="font-medium text-gray-800">10-4030-011094</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Bank Name:</span>
                        <span className="font-medium text-gray-800">Zenith Bank</span>
                    </div>
                </div>
            </div>

            <hr className="border-t border-gray-200" />

            <div className="flex justify-between items-center py-2">
                <span className="text-xl font-bold text-gray-800">Total</span>
                <span className="text-xl font-bold text-gray-800">{formatNaira(quoteTotal)}</span>
            </div>

            <hr className="border-t border-gray-200" />

            <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">ADDITIONAL NOTES</h3>
                <textarea
                    id="additionalNotes"
                    rows={4}
                    value={additionalNotes}
                    onChange={e => setAdditionalNotes(e.target.value)}
                    placeholder="Enter some additional notes here......"
                    className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 placeholder:text-gray-400"
                ></textarea>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
            <header className="p-4 flex items-center gap-4 sticky top-0 z-40 bg-white border-b border-gray-200">
                <button onClick={onBack} className="text-gray-600 hover:text-gray-900" aria-label="Go back">
                    <ChevronLeftIcon />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Create New Quote</h1>
            </header>

            <div className="border-b border-gray-200 px-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {(['Overview', 'Item-List', 'Extras & Notes'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-base transition-colors ${quoteTab === tab
                                ? 'border-gray-800 text-gray-800'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            <main className="flex-1 px-6 overflow-y-auto bg-gray-50">
                <div className="h-full">
                    {quoteTab === 'Overview' && renderOverview()}
                    {quoteTab === 'Item-List' && itemView === 'edit' && renderItemListEdit()}
                    {quoteTab === 'Item-List' && itemView === 'review' && renderItemListReview()}
                    {quoteTab === 'Extras & Notes' && renderExtrasAndNotes()}
                </div>
            </main>

            {quoteTab === 'Overview' && (
                <footer className="bg-white p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] sticky bottom-0 z-10">
                    <button
                        onClick={() => handleTabChange('Item-List')}
                        className="w-full py-4 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Next
                    </button>
                </footer>
            )}

            {quoteTab === 'Item-List' && (
                <footer className="bg-white p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] sticky bottom-0 z-10 space-y-3 border-t border-gray-200">
                    <button
                        onClick={() => {
                            if (itemView === 'edit') {
                                setItemView('review');
                            } else {
                                handleTabChange('Extras & Notes');
                            }
                        }}
                        className="w-full py-3.5 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Next
                    </button>
                    <button
                        onClick={() => console.log('Save as Draft')}
                        className="w-full py-3.5 bg-white text-gray-800 font-semibold rounded-lg border border-gray-400 hover:bg-gray-100 transition-colors"
                    >
                        Save as Draft
                    </button>
                </footer>
            )}

            {quoteTab === 'Extras & Notes' && (
                <footer className="bg-white p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] sticky bottom-0 z-10">
                    <button
                        onClick={handleFinalGenerateQuote}
                        className="w-full py-4 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Generate Quote
                    </button>
                </footer>
            )}

            <CalendarModal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                initialDate={issueDate}
                onSubmit={(date) => {
                    setIssueDate(date);
                    setIsCalendarOpen(false);
                }}
                onClear={() => {
                    setIssueDate(null);
                    setIsCalendarOpen(false);
                }}
            />

            <AddItemsModal
                isOpen={isAddItemsModalOpen}
                onClose={() => setIsAddItemsModalOpen(false)}
                initialSelection={selectedList}
                onConfirm={(selection) => {
                    setSelectedList(selection);
                    setIsAddItemsModalOpen(false);
                    // In a real app, this would open another modal to select items
                    console.log("Adding items from:", selection);
                }}
            />

            <DimensionInputModal
                isOpen={isDimensionModalOpen}
                onClose={() => {
                    setIsDimensionModalOpen(false);
                    setEditingDimension(null);
                }}
                onAdd={handleAddDimension}
                editingItem={editingDimension}
            />
        </div>
    );
}

export default NewProjectScreen;
