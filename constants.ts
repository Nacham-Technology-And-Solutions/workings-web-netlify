
import type { FloorPlan, EstimateCategory, Project, Quote, FullQuoteData, MaterialList, FullMaterialList } from './types';

export const sampleFloorPlan: FloorPlan = {
  walls: [
    { id: 'w1', start: { x: 50, y: 50 }, end: { x: 450, y: 50 } },
    { id: 'w2', start: { x: 450, y: 50 }, end: { x: 450, y: 350 } },
    { id: 'w3', start: { x: 450, y: 350 }, end: { x: 50, y: 350 } },
    { id: 'w4', start: { x: 50, y: 350 }, end: { x: 50, y: 50 } },
    { id: 'w5', start: { x: 200, y: 50 }, end: { x: 200, y: 200 } },
    { id: 'w6', start: { x: 50, y: 200 }, end: { x: 200, y: 200 } },
  ],
  doors: [
    { id: 'd1', position: { x: 100, y: 50 }, width: 30 },
    { id: 'd2', position: { x: 200, y: 150 }, width: 30 },
  ],
  windows: [
    { id: 'win1', position: { x: 250, y: 350 }, width: 60 },
    { id: 'win2', position: { x: 450, y: 150 }, width: 60 },
  ],
};

export const initialEstimates: EstimateCategory[] = [
  {
    name: 'Framing & Drywall',
    items: [
      { id: 'studs', description: '8ft Wood Studs', quantity: 0, unit: 'ea', unitCost: 4.50, total: 0 },
      { id: 'drywall', description: '4x8 Drywall Sheet', quantity: 0, unit: 'sqft', unitCost: 0.50, total: 0 },
    ],
  },
  {
    name: 'Openings',
    items: [
      { id: 'doors', description: 'Interior Door', quantity: 0, unit: 'ea', unitCost: 150, total: 0 },
      { id: 'windows', description: 'Standard Window', quantity: 0, unit: 'ea', unitCost: 250, total: 0 },
    ],
  },
  {
      name: 'Labor',
      items: [
          { id: 'framing_labor', description: 'Framing Labor', quantity: 8, unit: 'hr', unitCost: 75, total: 600 },
          { id: 'drywall_labor', description: 'Drywall & Finishing', quantity: 16, unit: 'hr', unitCost: 65, total: 1040 },
      ]
  }
];

export const sampleProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Olumide Residence Renovation',
    address: '123 Maple St, Springfield',
    status: 'Completed',
    lastUpdated: '2025-06-12T10:30:00Z',
    projectId: '#000045',
  },
  {
    id: 'proj-2',
    name: 'APO Home Furnishing',
    address: '456 Oak Ave, Metropolis',
    status: 'Draft',
    lastUpdated: '2025-06-14T16:45:00Z',
    projectId: '#000046',
  },
  {
    id: 'proj-3',
    name: 'Lakeside Cabin Build',
    address: '789 Pine Rd, Greenfield',
    status: 'In Progress',
    lastUpdated: '2024-06-30T09:00:00Z',
    projectId: '#000047',
  },
];

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

export const sampleMaterialLists: MaterialList[] = [
  {
    id: 'mlist-1',
    projectName: 'APO Home Furnishing',
    listNumber: '#000046',
    status: 'Draft',
    issueDate: '2025-11-01T10:30:00Z',
  },
  {
    id: 'mlist-2',
    projectName: 'Olumide Residence Renovation',
    listNumber: '#000045',
    status: 'Completed',
    issueDate: '2025-11-05T10:30:00Z',
  },
  {
    id: 'mlist-3',
    projectName: 'Victoria Island Office Complex',
    listNumber: '#000047',
    status: 'Completed',
    issueDate: '2025-10-28T10:30:00Z',
  },
  {
    id: 'mlist-4',
    projectName: 'Lekki Phase 1 Apartment',
    listNumber: '#000048',
    status: 'Draft',
    issueDate: '2025-11-07T10:30:00Z',
  },
  {
    id: 'mlist-5',
    projectName: 'Ikoyi Residential Tower',
    listNumber: '#000049',
    status: 'Completed',
    issueDate: '2025-10-15T10:30:00Z',
  },
  {
    id: 'mlist-6',
    projectName: 'Yaba Tech Hub',
    listNumber: '#000050',
    status: 'Draft',
    issueDate: '2025-11-03T10:30:00Z',
  },
  {
    id: 'mlist-7',
    projectName: 'Surulere Shopping Mall',
    listNumber: '#000051',
    status: 'Completed',
    issueDate: '2025-09-20T10:30:00Z',
  },
  {
    id: 'mlist-8',
    projectName: 'Ajah Beach House',
    listNumber: '#000052',
    status: 'Draft',
    issueDate: '2025-11-06T10:30:00Z',
  },
];

export const sampleFullMaterialLists: FullMaterialList[] = [
    {
        id: 'mlist-2',
        projectName: 'Olumide Residence Renovation',
        date: '2025-06-19T10:30:00Z',
        preparedBy: 'LEADS GLAZING',
        status: 'Completed',
        items: [
            { id: 'ml-item-1', description: 'Width', quantity: 10, unitPrice: 10000, total: 100000 },
            { id: 'ml-item-2', description: 'Glass', quantity: 10, unitPrice: 10000, total: 100000 },
            { id: 'ml-item-3', description: 'D/Curve', quantity: 10, unitPrice: 10000, total: 100000 },
        ],
        total: 300000,
    }
];
