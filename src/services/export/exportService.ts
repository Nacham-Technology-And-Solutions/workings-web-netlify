import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTemplateStore } from '@/stores/templateStore';

// Helper function to get page size dimensions
const getPageSize = (pageSize: string, customSize?: { width: number; height: number; unit: 'mm' | 'in' }) => {
  if (pageSize === 'Custom' && customSize) {
    return customSize.unit === 'mm' 
      ? [customSize.width, customSize.height] as [number, number]
      : [customSize.width * 25.4, customSize.height * 25.4] as [number, number];
  }
  
  const sizes: Record<string, [number, number]> = {
    'A4': [210, 297],
    'Letter': [216, 279],
    'Legal': [216, 356],
    'A3': [297, 420],
  };
  
  return sizes[pageSize] || sizes['A4'];
};

// Helper function to generate filename from pattern
const generateFileName = (pattern: string, quote: QuoteData, dateFormat: string = 'YYYY-MM-DD'): string => {
  const date = new Date();
  let dateStr = '';
  
  switch (dateFormat) {
    case 'DD-MM-YYYY':
      dateStr = date.toLocaleDateString('en-GB').replace(/\//g, '-');
      break;
    case 'MM/DD/YYYY':
      dateStr = date.toLocaleDateString('en-US');
      break;
    case 'YYYY/MM/DD':
      dateStr = date.toISOString().split('T')[0].replace(/-/g, '/');
      break;
    default:
      dateStr = date.toISOString().split('T')[0];
  }
  
  return pattern
    .replace('{quoteId}', quote.quoteId.replace(/#/g, ''))
    .replace('{projectName}', quote.projectName.replace(/\s+/g, '-'))
    .replace('{customerName}', quote.customerName.replace(/\s+/g, '-'))
    .replace('{quoteNumber}', quote.quoteId.replace(/#/g, ''))
    .replace('{date}', dateStr);
};

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

interface GlassCuttingLayout {
  sheetNumber: number;
  sheetType: string;
  sheetWidth: number;
  sheetHeight: number;
  cuts: Array<{
    w: number;
    h: number;
    qty: number;
  }>;
  totalCuts: number;
}

export const exportGlassCuttingListToPDF = (
  layouts: GlassCuttingLayout[],
  projectName: string
) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Glass Cutting List', 14, 20);

  // Project Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, 14, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);
  doc.text(`Total Sheets: ${layouts.length}`, 14, 42);

  let startY = 50;
  
  layouts.forEach((layout, index) => {
    // Check if we need a new page
    if (startY > 250) {
      doc.addPage();
      startY = 20;
    }

    // Sheet Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Sheet ${layout.sheetNumber}`, 14, startY);
    
    startY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sheet Type: ${layout.sheetType}`, 14, startY);
    startY += 6;
    doc.text(`Dimensions: ${layout.sheetWidth}mm x ${layout.sheetHeight}mm`, 14, startY);
    startY += 6;
    doc.text(`Total Cuts: ${layout.totalCuts}`, 14, startY);
    startY += 10;

    // Cuts Table
    const tableData = layout.cuts.map((cut) => [
      `${cut.w}mm`,
      `${cut.h}mm`,
      cut.qty
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['Width', 'Height', 'Quantity']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' }
    });

    startY = (doc as any).lastAutoTable.finalY + 10;
  });

  // Save
  doc.save(`Glass-Cutting-List-${projectName.replace(/\s+/g, '-')}.pdf`);
};

export const exportGlassCuttingListToExcel = (
  layouts: GlassCuttingLayout[],
  projectName: string
) => {
  // Create worksheet data
  const wsData = [
    ['Glass Cutting List'],
    [],
    ['Project:', projectName],
    ['Date:', new Date().toLocaleDateString()],
    ['Total Sheets:', layouts.length],
    [],
  ];

  // Add data for each sheet
  layouts.forEach((layout) => {
    wsData.push([]);
    wsData.push([`Sheet ${layout.sheetNumber}`]);
    wsData.push([`Sheet Type: ${layout.sheetType}`]);
    wsData.push([`Dimensions: ${layout.sheetWidth}mm x ${layout.sheetHeight}mm`]);
    wsData.push([`Total Cuts: ${layout.totalCuts}`]);
    wsData.push([]);
    wsData.push(['Width (mm)', 'Height (mm)', 'Quantity']);
    layout.cuts.forEach((cut) => {
      wsData.push([cut.w, cut.h, cut.qty]);
    });
  });

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Glass Cutting List');

  // Save file
  XLSX.writeFile(wb, `Glass-Cutting-List-${projectName.replace(/\s+/g, '-')}.xlsx`);
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
  // Get PDF export configuration from template store
  const pdfConfig = useTemplateStore.getState().pdfExport.quote;
  const fileNamingConfig = useTemplateStore.getState().pdfExport.fileNaming;
  const paymentMethodConfig = useTemplateStore.getState().paymentMethodConfig;

  // Get page size
  const pageSize = getPageSize(pdfConfig.pageSize, pdfConfig.customSize);
  
  // Create PDF document with configured page size and orientation
  const doc = new jsPDF({
    orientation: pdfConfig.orientation,
    unit: 'mm',
    format: pageSize,
  });

  let currentY = pdfConfig.header.enabled ? pdfConfig.header.height : 20;

  // Header section (if enabled)
  if (pdfConfig.header.enabled) {
    // Logo (if enabled and available from quote format config)
    const quoteFormat = useTemplateStore.getState().quoteFormat;
    if (pdfConfig.logo.enabled && quoteFormat.header.logoUrl) {
      // Note: jsPDF doesn't directly support base64 images easily, 
      // but we can add it if needed with addImage
      // For now, we'll skip logo in PDF as it requires additional handling
    }
    
    // Company name and tagline
    if (quoteFormat.header.companyName) {
      doc.setFontSize(pdfConfig.fonts.headingSize);
      doc.setFont(pdfConfig.fonts.family as any, 'bold');
      doc.setTextColor(pdfConfig.fonts.headingColor);
      doc.text(quoteFormat.header.companyName, 14, 20);
      currentY = 30;
      
      if (quoteFormat.header.tagline) {
        doc.setFontSize(pdfConfig.fonts.bodySize);
        doc.setFont(pdfConfig.fonts.family as any, 'normal');
        doc.text(quoteFormat.header.tagline, 14, currentY);
        currentY += 10;
      }
    } else {
      // Default header
      doc.setFontSize(pdfConfig.fonts.headingSize);
      doc.setFont(pdfConfig.fonts.family as any, 'bold');
      doc.setTextColor(pdfConfig.fonts.headingColor);
      doc.text('QUOTE', 14, currentY);
      currentY += 10;
    }
  } else {
    currentY = 20;
  }

  // Quote Info
  doc.setFontSize(pdfConfig.fonts.bodySize);
  doc.setFont(pdfConfig.fonts.family as any, 'normal');
  doc.setTextColor(pdfConfig.fonts.bodyColor);
  doc.text(`Quote ID: ${quote.quoteId}`, 14, currentY);
  currentY += 6;
  doc.text(`Issue Date: ${quote.issueDate}`, 14, currentY);
  currentY += 10;

  // Project Info
  doc.text(`Project: ${quote.projectName}`, 14, currentY);
  currentY += 6;
  doc.text(`Site Address: ${quote.siteAddress}`, 14, currentY);
  currentY += 10;

  // Customer Info
  doc.text(`Customer: ${quote.customerName}`, 14, currentY);
  currentY += 6;
  if (quote.customerEmail) {
    doc.text(`Email: ${quote.customerEmail}`, 14, currentY);
    currentY += 6;
  }
  currentY += 4;

  // Items Table
  const tableData = quote.items.map((item, index) => [
    index + 1,
    item.description,
    item.quantity,
    `₦${item.unitPrice.toLocaleString()}`,
    `₦${item.total.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['S/N', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: { 
      fontSize: pdfConfig.fonts.tableSize,
      font: pdfConfig.fonts.family as any,
      textColor: pdfConfig.fonts.bodyColor,
    },
    headStyles: { 
      fillColor: [55, 65, 81], 
      fontStyle: 'bold',
      textColor: [255, 255, 255],
    }
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY || currentY;
  currentY = finalY + 10;

  doc.setFontSize(pdfConfig.fonts.bodySize);
  doc.setFont(pdfConfig.fonts.family as any, 'normal');
  doc.setTextColor(pdfConfig.fonts.bodyColor);
  doc.text(`Subtotal: ₦${quote.summary.subtotal.toLocaleString()}`, 14, currentY);
  currentY += 6;

  // Charges
  quote.summary.charges.forEach(charge => {
    doc.text(`${charge.label}: ₦${charge.amount.toLocaleString()}`, 14, currentY);
    currentY += 6;
  });

  // Grand Total
  currentY += 3;
  doc.setFontSize(pdfConfig.fonts.headingSize);
  doc.setFont(pdfConfig.fonts.family as any, 'bold');
  doc.setTextColor(pdfConfig.fonts.headingColor);
  doc.text(`Grand Total: ₦${quote.summary.grandTotal.toLocaleString()}`, 14, currentY);
  currentY += 10;

  // Payment Information (only if enabled in config and payment info exists)
  if (paymentMethodConfig.displayOptions.showInPDF && quote.paymentInfo.accountName) {
    doc.setFontSize(pdfConfig.fonts.bodySize);
    doc.setFont(pdfConfig.fonts.family as any, 'bold');
    doc.setTextColor(pdfConfig.fonts.headingColor);
    doc.text('Payment Information', 14, currentY);
    currentY += 6;
    doc.setFont(pdfConfig.fonts.family as any, 'normal');
    doc.setTextColor(pdfConfig.fonts.bodyColor);
    doc.text(`Account Name: ${quote.paymentInfo.accountName}`, 14, currentY);
    currentY += 6;
    doc.text(`Account Number: ${quote.paymentInfo.accountNumber}`, 14, currentY);
    currentY += 6;
    doc.text(`Bank: ${quote.paymentInfo.bankName}`, 14, currentY);
    currentY += 6;
    
    // Custom payment instructions if available
    if (paymentMethodConfig.displayOptions.customInstructions) {
      currentY += 3;
      doc.text(paymentMethodConfig.displayOptions.customInstructions, 14, currentY);
    }
  }

  // Footer (if enabled)
  if (pdfConfig.footer.enabled) {
    const quoteFormat = useTemplateStore.getState().quoteFormat;
    if (quoteFormat.footer.visible && quoteFormat.footer.content) {
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerY = pageHeight - pdfConfig.footer.height;
      doc.setFontSize(pdfConfig.fonts.bodySize - 1);
      doc.setFont(pdfConfig.fonts.family as any, 'normal');
      doc.setTextColor(pdfConfig.fonts.bodyColor);
      doc.text(quoteFormat.footer.content, 14, footerY, {
        align: quoteFormat.footer.alignment as any,
      });
    }
  }

  // Generate filename from pattern
  const fileName = generateFileName(fileNamingConfig.pattern, quote, fileNamingConfig.dateFormat) + '.pdf';
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

  // Generate filename from pattern
  const fileNamingConfig = useTemplateStore.getState().pdfExport.fileNaming;
  const fileName = generateFileName(fileNamingConfig.pattern, quote, fileNamingConfig.dateFormat) + '.xlsx';
  XLSX.writeFile(wb, fileName);
};

