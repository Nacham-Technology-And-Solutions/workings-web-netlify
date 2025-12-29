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
}

interface QuoteSummary {
  subtotal: number;
  charges: { label: string; amount: number }[];
  grandTotal: number;
}

interface PaymentInfo {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export const exportQuoteToPDF = (
  quoteId: string,
  issueDate: string,
  customerName: string,
  projectName: string,
  siteAddress: string,
  items: QuoteItem[],
  summary: QuoteSummary,
  paymentInfo: PaymentInfo
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const rightAlignX = pageWidth - margin;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Quote Preview', margin, 20);

  let yPos = 30;

  // Quote Information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Quote ID: ${quoteId}`, margin, yPos);
  yPos += 6;
  doc.text(`Issue Date: ${issueDate}`, margin, yPos);
  yPos += 6;
  doc.text(`Billed to: ${customerName}`, margin, yPos);
  yPos += 6;
  doc.text(`Project: ${projectName}`, margin, yPos);
  yPos += 6;
  doc.text(`Location: ${siteAddress}`, margin, yPos);
  yPos += 10;

  // Item Lists Table
  const tableData = items.map((item) => [
    item.description,
    item.quantity.toString(),
    `₦${item.unitPrice.toLocaleString()}`,
    `₦${item.total.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold', textColor: [255, 255, 255] },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  // Summary Section
  const finalY = (doc as any).lastAutoTable.finalY || yPos;
  yPos = finalY + 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Subtotal
  doc.text('Subtotal', margin, yPos);
  const subtotalText = `₦${summary.subtotal.toLocaleString()}`;
  doc.text(subtotalText, rightAlignX - doc.getTextWidth(subtotalText), yPos);
  yPos += 6;

  // Charges
  summary.charges.forEach((charge) => {
    doc.text(charge.label, margin, yPos);
    const chargeText = `₦${charge.amount.toLocaleString()}`;
    doc.text(chargeText, rightAlignX - doc.getTextWidth(chargeText), yPos);
    yPos += 6;
  });

  // Grand Total
  yPos += 3;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total', margin, yPos);
  const grandTotalText = `₦${summary.grandTotal.toLocaleString()}`;
  doc.text(grandTotalText, rightAlignX - doc.getTextWidth(grandTotalText), yPos);
  yPos += 10;

  // Payment Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT INFORMATION', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Account Name: ${paymentInfo.accountName}`, margin, yPos);
  yPos += 6;
  doc.text(`Account Number: ${paymentInfo.accountNumber}`, margin, yPos);
  yPos += 6;
  doc.text(`Bank Name: ${paymentInfo.bankName}`, margin, yPos);

  // Save
  const fileName = `Quote-${quoteId.replace('#', '')}-${projectName.replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
};

