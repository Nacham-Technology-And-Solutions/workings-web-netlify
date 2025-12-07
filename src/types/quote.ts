import type { ProjectStatus } from './project';

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type?: 'material' | 'dimension'; // Optional field to distinguish item types
  width?: number; // For dimension items
  height?: number; // For dimension items
  panels?: number; // For dimension items
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Paid';

export interface Quote {
  id: string;
  quoteNumber: string;
  projectName: string;
  customerName: string;
  status: QuoteStatus;
  total: number;
  issueDate: string; // ISO string date
}

export interface QuotePreviewData {
  projectName: string;
  siteAddress: string;
  customerName: string;
  customerEmail: string;
  quoteId: string;
  issueDate: string;
  items: QuoteItem[];
  summary: {
    subtotal: number;
    charges: { label: string; amount: number }[];
    grandTotal: number;
  };
  paymentInfo: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

export interface FullQuoteData {
  id: string;
  projectName: string;
  location: string;
  projectStatus: ProjectStatus;
  quoteId: string;
  issueDate: string; // ISO string date
  customerName: string;
  customerEmail: string;
  items: QuoteItem[];
  summary: {
    subtotal: number;
    charges: { label: string; amount: number }[];
    grandTotal: number;
  };
}

