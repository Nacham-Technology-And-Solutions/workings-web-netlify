import React, { useState } from 'react';
import { ChevronLeftIcon } from './icons/IconComponents';
import Input from './Input';

interface QuoteConfigurationScreenProps {
  onBack: () => void;
  onGenerateQuote: (quoteData: QuoteConfigurationData) => void;
  materialCost: number;
  projectData?: {
    projectName?: string;
    customerName?: string;
    siteAddress?: string;
  };
}

export interface QuoteConfigurationData {
  quoteName: string;
  customerName: string;
  siteAddress: string;
  quoteValidity: number; // days
  projectStatus: string;
  customerContact: string;
  labourCost: number;
  transportationCost: number;
  miscellaneous: number;
  discount: number;
  materialCost: number;
  totalQuote: number;
}

const QuoteConfigurationScreen: React.FC<QuoteConfigurationScreenProps> = ({ 
  onBack, 
  onGenerateQuote, 
  materialCost,
  projectData 
}) => {
  const [quoteName, setQuoteName] = useState(projectData?.projectName || 'Olumide Residence Renovation');
  const [customerName, setCustomerName] = useState(projectData?.customerName || 'Olumide Adewale');
  const [siteAddress, setSiteAddress] = useState(projectData?.siteAddress || 'Lagos Island Apartment Refurbishment');
  const [quoteValidity, setQuoteValidity] = useState('15');
  const [projectStatus, setProjectStatus] = useState('Ongoing');
  const [customerContact, setCustomerContact] = useState('');
  const [labourCost, setLabourCost] = useState('50000');
  const [transportationCost, setTransportationCost] = useState('10000');
  const [miscellaneous, setMiscellaneous] = useState('5000');
  const [discount, setDiscount] = useState('2500');

  const projectStatusOptions = [
    'Ongoing',
    'Pending',
    'Completed',
    'On Hold'
  ];

  const calculateTotal = () => {
    const labour = parseFloat(labourCost) || 0;
    const transport = parseFloat(transportationCost) || 0;
    const misc = parseFloat(miscellaneous) || 0;
    const disc = parseFloat(discount) || 0;
    
    return materialCost + labour + transport + misc - disc;
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const handleGenerate = () => {
    const quoteData: QuoteConfigurationData = {
      quoteName,
      customerName,
      siteAddress,
      quoteValidity: parseInt(quoteValidity) || 15,
      projectStatus,
      customerContact,
      labourCost: parseFloat(labourCost) || 0,
      transportationCost: parseFloat(transportationCost) || 0,
      miscellaneous: parseFloat(miscellaneous) || 0,
      discount: parseFloat(discount) || 0,
      materialCost,
      totalQuote: calculateTotal()
    };
    
    onGenerateQuote(quoteData);
  };

  const isFormValid = quoteName.trim() !== '' && 
                      customerName.trim() !== '' && 
                      siteAddress.trim() !== '';

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-gray-200">
        <button 
          onClick={onBack} 
          className="text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Create Quote</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Quote Details Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Details</h2>
            
            <div className="space-y-4">
              <Input
                id="quoteName"
                label="Quote Name"
                placeholder="Enter quote name"
                value={quoteName}
                onChange={(e) => setQuoteName(e.target.value)}
                required
              />

              <Input
                id="customerName"
                label="Customer's Name"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />

              <Input
                id="siteAddress"
                label="Site Address"
                placeholder="Enter site address"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                required
              />

              <div>
                <label htmlFor="quoteValidity" className="block text-sm font-medium text-gray-900 mb-2">
                  Quote Validity (Days)
                </label>
                <input
                  type="number"
                  id="quoteValidity"
                  value={quoteValidity}
                  onChange={(e) => setQuoteValidity(e.target.value)}
                  placeholder="15"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label htmlFor="projectStatus" className="block text-sm font-medium text-gray-900 mb-2">
                  Project Status
                </label>
                <select
                  id="projectStatus"
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {projectStatusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <Input
                id="customerContact"
                label="Customer Contact"
                placeholder="Enter phone number or email"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
              />
            </div>
          </div>

          {/* Cost Breakdown Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h2>
            
            <div className="space-y-4">
              {/* Material Cost (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Material Cost
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-medium">
                  {formatCurrency(materialCost)}
                </div>
              </div>

              {/* Labour Cost */}
              <div>
                <label htmlFor="labourCost" className="block text-sm font-medium text-gray-900 mb-2">
                  Labour Cost
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="text"
                    id="labourCost"
                    value={labourCost}
                    onChange={(e) => setLabourCost(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Transportation Cost */}
              <div>
                <label htmlFor="transportationCost" className="block text-sm font-medium text-gray-900 mb-2">
                  Transportation Cost
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="text"
                    id="transportationCost"
                    value={transportationCost}
                    onChange={(e) => setTransportationCost(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Miscellaneous */}
              <div>
                <label htmlFor="miscellaneous" className="block text-sm font-medium text-gray-900 mb-2">
                  Miscellaneous
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="text"
                    id="miscellaneous"
                    value={miscellaneous}
                    onChange={(e) => setMiscellaneous(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Discount */}
              <div>
                <label htmlFor="discount" className="block text-sm font-medium text-gray-900 mb-2">
                  Discount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="text"
                    id="discount"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Cost Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Material Cost:</span>
                <span className="text-gray-900 font-medium">{formatCurrency(materialCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Labour Cost:</span>
                <span className="text-gray-900 font-medium">{formatCurrency(parseFloat(labourCost) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transportation:</span>
                <span className="text-gray-900 font-medium">{formatCurrency(parseFloat(transportationCost) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Miscellaneous:</span>
                <span className="text-gray-900 font-medium">{formatCurrency(parseFloat(miscellaneous) || 0)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span className="font-medium">-{formatCurrency(parseFloat(discount) || 0)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-900 font-bold text-base">Total Quote:</span>
                  <span className="text-gray-900 font-bold text-lg">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-white border-t border-gray-200">
        <button
          onClick={handleGenerate}
          disabled={!isFormValid}
          className={`w-full py-4 rounded-lg font-semibold transition-colors ${
            isFormValid
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Generate Quote
        </button>
      </div>
    </div>
  );
};

export default QuoteConfigurationScreen;

