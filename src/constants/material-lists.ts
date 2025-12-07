import type { MaterialList, FullMaterialList } from '../types';

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

