import type { Quote, FullQuoteData } from '../types';

export const sampleQuotes: Quote[] = [
  {
    id: 'quote-1',
    quoteNumber: '#000045',
    projectName: 'Olumide Residence Renovation',
    customerName: 'Olumide Adewale',
    status: 'Paid',
    total: 1140000,
    issueDate: '2025-06-19T10:30:00Z',
  },
  {
    id: 'quote-2',
    quoteNumber: '#000046',
    projectName: 'APO Home Furnishing',
    customerName: 'APO Home',
    status: 'Draft',
    total: 103400,
    issueDate: '2025-06-14T10:30:00Z',
  },
  {
    id: 'quote-3',
    quoteNumber: '#000047',
    projectName: 'Ikoyi Office Complex',
    customerName: 'Corporate Builders Inc.',
    status: 'Sent',
    total: 1250000,
    issueDate: '2025-06-20T10:30:00Z',
  },
];

export const sampleFullQuotes: FullQuoteData[] = [
  {
    id: 'quote-1',
    projectName: 'Olumide Residence Renovation',
    location: 'Lagos Island Apartment Refurbishment',
    projectStatus: 'Completed',
    quoteId: '#000045',
    issueDate: '2025-06-19T10:30:00Z',
    customerName: 'Olumide Adewale',
    customerEmail: 'olumideadewale@gmail.com',
    items: [
      { id: 'item-1', description: '1200x1200', quantity: 10, unitPrice: 100000, total: 1000000 },
      { id: 'item-2', description: '600x700', quantity: 4, unitPrice: 35000, total: 140000 },
    ],
    summary: {
      subtotal: 1140000,
      charges: [
        { label: 'Labor Charge', amount: 250000 },
        { label: 'Transport Charge', amount: 70000 }
      ],
      grandTotal: 1460000,
    }
  }
];

