
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { MaterialListItem, FullMaterialList } from '../types';
import { ChevronLeftIcon, CalendarIcon, ChevronDownIcon, ChevronUpIcon, PlusCircleIcon, TrashIcon } from './icons/IconComponents';
import Input from './Input';
import CalendarModal from './CalendarModal';

interface CreateMaterialListScreenProps {
  onBack: () => void;
  onPreview: (data: FullMaterialList) => void;
}

type EditableMaterialItem = Omit<MaterialListItem, 'total' | 'quantity' | 'unitPrice'> & {
    quantity: string;
    unitPrice: string;
};

const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount).replace('NGN', '₦');
};

const getDayWithSuffix = (day: number) => {
    if (day > 3 && day < 21) return day + 'th';
    switch (day % 10) {
        case 1:  return day + "st";
        case 2:  return day + "nd";
        case 3:  return day + "rd";
        default: return day + "th";
    }
};

const formatDisplayDate = (date: Date | null): string => {
    if (!date) return '';
    const day = date.getUTCDate();
    const month = date.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
    const year = date.getUTCFullYear();
    return `${getDayWithSuffix(day)} ${month}, ${year}`;
};

const ItemCard: React.FC<{
    item: EditableMaterialItem;
    index: number;
    onItemChange: (index: number, field: keyof EditableMaterialItem, value: string) => void;
    onRemove: (index: number) => void;
}> = ({ item, index, onItemChange, onRemove }) => {
    const amount = useMemo(() => {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.unitPrice);
        return isNaN(qty) || isNaN(price) ? 0 : qty * price;
    }, [item.quantity, item.unitPrice]);

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Item {index + 1}</h3>
                <button onClick={() => onRemove(index)} aria-label={`Remove Item ${index + 1}`}>
                    <TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-500" />
                </button>
            </div>
            <div className="space-y-4">
                <Input
                    id={`description-${index}`}
                    label="Description"
                    value={item.description}
                    onChange={(e) => onItemChange(index, 'description', e.target.value)}
                    placeholder="e.g., Low-Iron Glass"
                />
                <div className="grid grid-cols-3 gap-3">
                    <Input
                        id={`qty-${index}`}
                        label="Qty"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onItemChange(index, 'quantity', e.target.value)}
                        placeholder="0"
                    />
                    <Input
                        id={`price-${index}`}
                        label="Price"
                        type="text"
                        value={item.unitPrice ? parseFloat(item.unitPrice).toLocaleString('en-US') : ''}
                        onChange={(e) => onItemChange(index, 'unitPrice', e.target.value.replace(/,/g, ''))}
                        placeholder="0"
                    />
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <div className="w-full px-4 py-3.5 text-gray-600 bg-gray-100 border border-gray-200 rounded-xl">
                            {formatNaira(amount)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const CreateMaterialListScreen: React.FC<CreateMaterialListScreenProps> = ({ onBack, onPreview }) => {
    const [projectName, setProjectName] = useState('Bello Office Window Installation');
    const [date, setDate] = useState<Date | null>(new Date('2025-06-14T00:00:00.000Z'));
    const [preparedBy, setPreparedBy] = useState('LEADS GLAZING');
    const [items, setItems] = useState<EditableMaterialItem[]>([
        { id: '1', description: 'Low-Iron Glass', quantity: '6', unitPrice: '12000' },
        { id: '2', description: 'EPDM Glazing Tape', quantity: '2', unitPrice: '4000' },
    ]);
    
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isArtisanDropdownOpen, setIsArtisanDropdownOpen] = useState(false);
    const artisanDropdownRef = useRef<HTMLDivElement>(null);
    
    const artisanOptions = ['LEADS GLAZING', 'Tunde Builders', 'Chioma Interiors'];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (artisanDropdownRef.current && !artisanDropdownRef.current.contains(event.target as Node)) {
                setIsArtisanDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const total = useMemo(() => {
        return items.reduce((sum, item) => {
            const qty = parseFloat(item.quantity);
            const price = parseFloat(item.unitPrice);
            if (!isNaN(qty) && !isNaN(price)) {
                return sum + qty * price;
            }
            return sum;
        }, 0);
    }, [items]);

    const handleItemChange = (index: number, field: keyof EditableMaterialItem, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { id: `item-${Date.now()}`, description: '', quantity: '1', unitPrice: '' }]);
    };

    const removeItem = (indexToRemove: number) => {
        setItems(items.filter((_, index) => index !== indexToRemove));
    };

    const handleProceedToPreview = () => {
        const previewData: FullMaterialList = {
            id: `mlist-prev-${Date.now()}`,
            projectName: projectName,
            date: date ? date.toISOString() : new Date().toISOString(),
            preparedBy: preparedBy,
            status: 'Draft',
            items: items.map(item => {
                const quantity = parseFloat(item.quantity) || 0;
                const unitPrice = parseFloat(item.unitPrice) || 0;
                return {
                    id: item.id,
                    description: item.description,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    total: quantity * unitPrice
                };
            }),
            total: total
        };
        onPreview(previewData);
    };

    return (
        <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
            <header className="p-4 flex items-center gap-4 sticky top-0 z-40 bg-white border-b border-gray-200">
                <button onClick={onBack} className="text-gray-600 hover:text-gray-900" aria-label="Go back">
                    <ChevronLeftIcon />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Create Material List</h1>
            </header>

            <main className="flex-1 px-6 py-6 overflow-y-auto bg-gray-50">
                <form className="space-y-6">
                    <Input
                        id="projectName"
                        label="Project name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter project name"
                    />
                    <div onClick={() => setIsCalendarOpen(true)} className="cursor-pointer">
                        <Input
                            id="date"
                            label="Date"
                            value={formatDisplayDate(date)}
                            readOnly
                            placeholder="Select a date"
                            rightIcon={<CalendarIcon className="text-gray-500" />}
                            className="pointer-events-none"
                        />
                    </div>
                     <div className="relative" ref={artisanDropdownRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prepared by (Artisan's name)
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsArtisanDropdownOpen(!isArtisanDropdownOpen)}
                            className="w-full flex justify-between items-center px-4 py-3.5 text-left bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
                        >
                            <span className={preparedBy ? 'text-gray-900' : 'text-gray-400'}>
                                {preparedBy || 'Select an artisan'}
                            </span>
                            {isArtisanDropdownOpen ? <ChevronUpIcon className="text-gray-500" /> : <ChevronDownIcon className="text-gray-500" />}
                        </button>
                        {isArtisanDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
                                <ul className="py-1 max-h-60 overflow-y-auto">
                                    {artisanOptions.map(option => (
                                        <li
                                            key={option}
                                            onClick={() => {
                                                setPreparedBy(option);
                                                setIsArtisanDropdownOpen(false);
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
                </form>

                <div className="mt-8">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">ITEM LISTS</h3>
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <ItemCard
                                key={item.id}
                                item={item}
                                index={index}
                                onItemChange={handleItemChange}
                                onRemove={removeItem}
                            />
                        ))}
                    </div>

                    <button
                        onClick={addItem}
                        className="w-full flex items-center justify-center gap-2 py-3 mt-4 text-cyan-600 font-semibold"
                    >
                        <span>Add an Item</span>
                        <PlusCircleIcon className="text-cyan-600" />
                    </button>

                    <div className="mt-8 py-4 border-t-2 border-gray-300">
                        <div className="flex justify-between items-center text-xl">
                            <span className="text-gray-800 font-bold">Total</span>
                            <span className="text-gray-900 font-bold">{formatNaira(total)}</span>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-white p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] sticky bottom-0 z-10 space-y-3 border-t border-gray-200">
                <button
                    type="button"
                    onClick={handleProceedToPreview}
                    className="w-full py-3.5 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                    Proceed to preview
                </button>
                <button
                    className="w-full py-3.5 bg-white text-gray-800 font-semibold rounded-lg border border-gray-400 hover:bg-gray-100 transition-colors"
                >
                    Save as Draft
                </button>
            </footer>

            <CalendarModal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                initialDate={date}
                onSubmit={(newDate) => {
                    setDate(newDate);
                    setIsCalendarOpen(false);
                }}
                onClear={() => {
                    setDate(null);
                    setIsCalendarOpen(false);
                }}
            />
        </div>
    );
};

export default CreateMaterialListScreen;
