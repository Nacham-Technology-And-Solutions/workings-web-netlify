import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface CuttingLayout {
  id: string;
  layout: string;
  repetition: number;
  cuts: { length: number; unit: string }[];
  offCut: number;
}

export const exportMaterialListToPDF = (
  materials: MaterialItem[],
  projectName: string,
  customerName: string,
  grandTotal: number
) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Material List', 14, 20);

  // Project Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, 14, 30);
  doc.text(`Customer: ${customerName}`, 14, 36);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 42);

  // Material Table
  const tableData = materials.map((item, index) => [
    index + 1,
    item.name,
    item.quantity,
    item.unit,
    `₦${item.unitPrice.toLocaleString()}`,
    `₦${item.total.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['S/N', 'Item', 'Quantity', 'Unit', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' }
  });

  // Grand Total
  const finalY = (doc as any).lastAutoTable.finalY || 50;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total: ₦${grandTotal.toLocaleString()}`, 14, finalY + 10);

  // Save
  doc.save(`Material-List-${projectName.replace(/\s+/g, '-')}.pdf`);
};

export const exportCuttingListToPDF = (
  layouts: CuttingLayout[],
  projectName: string,
  materialLength: number,
  materialQuantity: number
) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Cutting List', 14, 20);

  // Project Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, 14, 30);
  doc.text(`Material Length: ${materialLength} meters`, 14, 36);
  doc.text(`Quantity: ${materialQuantity} length`, 14, 42);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 48);

  // Cutting Layout Table
  const tableData = layouts.map((layout) => [
    layout.layout,
    `${layout.repetition}X`,
    layout.cuts.map(c => `${c.length}${c.unit}`).join(', '),
    `${layout.offCut}m`
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['Layout', 'Repetition', 'Cuts', 'Off-cut']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' }
  });

  // Save
  doc.save(`Cutting-List-${projectName.replace(/\s+/g, '-')}.pdf`);
};

export const exportMaterialListToExcel = (
  materials: MaterialItem[],
  projectName: string,
  customerName: string,
  grandTotal: number
) => {
  // Create worksheet data
  const wsData = [
    ['Material List'],
    [],
    ['Project:', projectName],
    ['Customer:', customerName],
    ['Date:', new Date().toLocaleDateString()],
    [],
    ['S/N', 'Item', 'Quantity', 'Unit', 'Unit Price (₦)', 'Total (₦)'],
    ...materials.map((item, index) => [
      index + 1,
      item.name,
      item.quantity,
      item.unit,
      item.unitPrice,
      item.total
    ]),
    [],
    ['', '', '', '', 'Grand Total:', grandTotal]
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Style the header
  ws['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Material List');

  // Save file
  XLSX.writeFile(wb, `Material-List-${projectName.replace(/\s+/g, '-')}.xlsx`);
};

export const exportCuttingListToExcel = (
  layouts: CuttingLayout[],
  projectName: string,
  materialLength: number,
  materialQuantity: number
) => {
  // Create worksheet data
  const wsData = [
    ['Cutting List'],
    [],
    ['Project:', projectName],
    ['Material Length:', `${materialLength} meters`],
    ['Quantity:', `${materialQuantity} length`],
    ['Date:', new Date().toLocaleDateString()],
    [],
    ['Layout', 'Repetition', 'Cuts', 'Off-cut (m)'],
    ...layouts.map((layout) => [
      layout.layout,
      `${layout.repetition}X`,
      layout.cuts.map(c => `${c.length}${c.unit}`).join(', '),
      layout.offCut
    ])
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 30 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Cutting List');

  // Save file
  XLSX.writeFile(wb, `Cutting-List-${projectName.replace(/\s+/g, '-')}.xlsx`);
};

export const shareData = async (
  type: 'material' | 'cutting',
  data: any,
  projectName: string
) => {
  // Check if Web Share API is available
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${type === 'material' ? 'Material List' : 'Cutting List'} - ${projectName}`,
        text: `View the ${type} list for project: ${projectName}`,
        url: window.location.href
      });
      return { success: true, message: 'Shared successfully' };
    } catch (error) {
      console.error('Error sharing:', error);
      return { success: false, message: 'Share cancelled or failed' };
    }
  } else {
    // Fallback: Copy to clipboard
    const text = type === 'material' 
      ? `Material List for ${projectName}\n${JSON.stringify(data, null, 2)}`
      : `Cutting List for ${projectName}\n${JSON.stringify(data, null, 2)}`;
    
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, message: 'Copied to clipboard!' };
    } catch (error) {
      return { success: false, message: 'Could not copy to clipboard' };
    }
  }
};

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type?: 'material' | 'dimension';
  width?: number;
  height?: number;
  panels?: number;
}

interface QuoteData {
  projectName: string;
  siteAddress: string;
  customerName: string;
  customerEmail: string;
  quoteId: string;
  issueDate: string;
  items: QuoteItem[];
  summary: {
    subtotal: number;
    charges: Array<{ label: string; amount: number }>;
    grandTotal: number;
  };
  paymentInfo: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

/**
 * Export quote to PDF
 */
export const exportQuoteToPDF = (quote: QuoteData) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTE', 14, 20);

  // Quote Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Quote ID: ${quote.quoteId}`, 14, 30);
  doc.text(`Issue Date: ${quote.issueDate}`, 14, 36);

  // Project Info
  doc.text(`Project: ${quote.projectName}`, 14, 45);
  doc.text(`Site Address: ${quote.siteAddress}`, 14, 51);

  // Customer Info
  doc.text(`Customer: ${quote.customerName}`, 14, 60);
  if (quote.customerEmail) {
    doc.text(`Email: ${quote.customerEmail}`, 14, 66);
  }

  // Items Table
  const tableData = quote.items.map((item, index) => [
    index + 1,
    item.description,
    item.quantity,
    `₦${item.unitPrice.toLocaleString()}`,
    `₦${item.total.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['S/N', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' }
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY || 75;
  let currentY = finalY + 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal: ₦${quote.summary.subtotal.toLocaleString()}`, 14, currentY);
  currentY += 6;

  // Charges
  quote.summary.charges.forEach(charge => {
    doc.text(`${charge.label}: ₦${charge.amount.toLocaleString()}`, 14, currentY);
    currentY += 6;
  });

  // Grand Total
  currentY += 3;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total: ₦${quote.summary.grandTotal.toLocaleString()}`, 14, currentY);
  currentY += 10;

  // Payment Information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Information', 14, currentY);
  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Account Name: ${quote.paymentInfo.accountName}`, 14, currentY);
  currentY += 6;
  doc.text(`Account Number: ${quote.paymentInfo.accountNumber}`, 14, currentY);
  currentY += 6;
  doc.text(`Bank: ${quote.paymentInfo.bankName}`, 14, currentY);

  // Save
  const fileName = `Quote-${quote.quoteId.replace(/#/g, '')}-${quote.projectName.replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
};

/**
 * Export quote to Excel
 */
export const exportQuoteToExcel = (quote: QuoteData) => {
  // Create worksheet data
  const wsData = [
    ['QUOTE'],
    [],
    ['Quote ID:', quote.quoteId],
    ['Issue Date:', quote.issueDate],
    ['Project:', quote.projectName],
    ['Site Address:', quote.siteAddress],
    ['Customer:', quote.customerName],
    ['Customer Email:', quote.customerEmail || ''],
    [],
    ['S/N', 'Description', 'Quantity', 'Unit Price (₦)', 'Total (₦)'],
    ...quote.items.map((item, index) => [
      index + 1,
      item.description,
      item.quantity,
      item.unitPrice,
      item.total
    ]),
    [],
    ['', '', '', 'Subtotal:', quote.summary.subtotal],
  ];

  // Add charges
  quote.summary.charges.forEach(charge => {
    wsData.push(['', '', '', `${charge.label}:`, charge.amount]);
  });

  // Add grand total
  wsData.push(['', '', '', 'Grand Total:', quote.summary.grandTotal]);
  wsData.push([]);
  wsData.push(['Payment Information']);
  wsData.push(['Account Name:', quote.paymentInfo.accountName]);
  wsData.push(['Account Number:', quote.paymentInfo.accountNumber]);
  wsData.push(['Bank Name:', quote.paymentInfo.bankName]);

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Style the columns
  ws['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Quote');

  // Save file
  const fileName = `Quote-${quote.quoteId.replace(/#/g, '')}-${quote.projectName.replace(/\s+/g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

