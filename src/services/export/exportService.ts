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

export interface CuttingLayout {
  id?: string;
  layout: string;
  repetition: number;
  cuts: { length: number; unit: string; elementTitle?: string; elementColor?: string }[];
  offCut: number;
  stockLength?: number; // meters, for visual bar proportion
}

/** One profile's cutting data for a single PDF/Excel (all profiles in one file) */
export interface CuttingListSection {
  profileName: string;
  materialLength: number;
  totalQuantity: number;
  layouts: CuttingLayout[];
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

/** Material list item format from FullMaterialList */
interface FullMaterialListItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * Export material list to PDF (accepts FullMaterialList format with description, not name)
 */
export const exportFullMaterialListToPDF = (
  items: FullMaterialListItem[],
  projectName: string,
  preparedBy: string,
  grandTotal: number,
  date?: string
) => {
  const materials: MaterialItem[] = items.map((item) => ({
    id: item.id,
    name: item.description,
    quantity: item.quantity,
    unit: 'pcs',
    unitPrice: item.unitPrice,
    total: item.total,
  }));
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Material List', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, 14, 30);
  doc.text(`Prepared by: ${preparedBy}`, 14, 36);
  doc.text(`Date: ${date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString()}`, 14, 42);

  const tableData = materials.map((item, index) => [
    index + 1,
    item.name,
    item.quantity,
    item.unit,
    `₦${item.unitPrice.toLocaleString()}`,
    `₦${item.total.toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['S/N', 'Description', 'Quantity', 'Unit', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 50;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total: ₦${grandTotal.toLocaleString()}`, 14, finalY + 10);

  doc.save(`Material-List-${projectName.replace(/\s+/g, '-')}.pdf`);
};

/** Hex to RGB tuple [r,g,b] for jsPDF */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [107, 158, 182]; // fallback grey-blue
}

/** Group cuts by (length mm, elementColor) for Cut/Length and Cut across repetition tables */
function groupCutsForTables(cuts: { length: number; unit: string; elementTitle?: string; elementColor?: string }[], repetition: number) {
  const map = new Map<string, { lengthMm: number; qtyPerBar: number; elementTitle?: string; elementColor?: string }>();
  cuts.forEach((c) => {
    const lengthMm = Math.round(c.length * 1000);
    const key = `${lengthMm}_${c.elementColor ?? 'default'}`;
    const existing = map.get(key);
    if (existing) {
      existing.qtyPerBar += 1;
    } else {
      map.set(key, {
        lengthMm,
        qtyPerBar: 1,
        elementTitle: c.elementTitle,
        elementColor: c.elementColor,
      });
    }
  });
  return Array.from(map.values()).map((row) => ({
    ...row,
    qtyAcrossRepetition: row.qtyPerBar * repetition,
  }));
}

export const exportCuttingListToPDF = (
  sections: CuttingListSection[],
  projectName: string
) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const footerHeight = 12;
  const contentBottom = pageH - footerHeight;

  const quoteFormat = useTemplateStore.getState().quoteFormat;
  // Always show logo placeholder for Cutting List (matches destination layout)
  const logoEnabled = true;

  let startY = 20;

  sections.forEach((section, sectionIndex) => {
    // Profile header when multiple profiles or first section
    if (sectionIndex > 0) {
      if (startY > contentBottom - 100) {
        doc.addPage();
        startY = 20;
      } else {
        startY += 6;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text(`Profile: ${section.profileName}`, margin, startY);
      startY += 10;
    }

    section.layouts.forEach((layout, layoutIndex) => {
      const isFirst = sectionIndex === 0 && layoutIndex === 0;
      if (!isFirst && startY > contentBottom - 100) {
        doc.addPage();
        startY = 20;
      } else if (!isFirst) {
        startY += 8;
      }

      if (isFirst) {
        // Header: CUTTING LIST left, Logo placeholder right
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text('CUTTING LIST', margin, startY);
        if (logoEnabled) {
          doc.setFillColor(75, 85, 99);
          doc.rect(pageW - margin - 30, startY - 6, 30, 12, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text('Logo', pageW - margin - 15, startY + 1, { align: 'center' });
          doc.setTextColor(55, 65, 81);
        }
        startY += 12;

        // Project info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Project: ${projectName}`, margin, startY);
        startY += 6;
        doc.text(`Material Length: ${section.materialLength} meters`, margin, startY);
        startY += 6;
        doc.text(`Quantity: ${section.totalQuantity} length`, margin, startY);
        startY += 6;
        doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, startY);
        startY += 12;
      }

      const stockLength = layout.stockLength ?? section.materialLength;
      const cardPadding = 6;
      const cardTop = startY;
      const grouped = groupCutsForTables(layout.cuts, layout.repetition);

      // Card background (white cards like destination)
      const estimatedCardH = 62 + grouped.length * 10 + 26;
      doc.setDrawColor(229, 231, 235);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, cardTop - 2, pageW - 2 * margin, estimatedCardH, 2, 2, 'FD');

      // Top row: Labels (Layout, Repetition, Off-cuts) then values
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Layout', margin + cardPadding, startY + 3);
      doc.text('Repetition', margin + 45, startY + 3);
      doc.text('Off-cuts', margin + 85, startY + 3);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text(layout.layout, margin + cardPadding, startY + 10);
      doc.text(`${layout.repetition}X`, margin + 45, startY + 10);
      doc.text(`${layout.offCut.toFixed(1)}m`, margin + 85, startY + 10);
      startY += 18;

      // Two tables side by side (Cut/Length | Cut across repetition) — match destination
      const gap = 12;
      const tableW = (pageW - 2 * margin - 2 * cardPadding - gap) / 2;
      const col1X = margin + cardPadding;
      const col2X = margin + cardPadding + tableW + gap;

      const applyCellColor = (data: any, grp: typeof grouped) => {
        if (data.section === 'body' && data.column.index === 0) {
          const rowIdx = data.row.index;
          const color = grp[rowIdx]?.elementColor;
          const [r, g, b] = color ? hexToRgb(color) : [147, 197, 253]; // light blue fallback when no element color
          data.cell.styles.fillColor = [r, g, b];
        }
      };

      autoTable(doc, {
        startX: col1X,
        startY,
        head: [['Cut/Length']],
        body: grouped.map((r) => [`${r.lengthMm} ${r.qtyPerBar} pcs`]),
        theme: 'plain',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [229, 231, 235], fontStyle: 'bold', textColor: [55, 65, 81] },
        columnStyles: { 0: { cellWidth: tableW - 8 } },
        margin: { left: 0 },
        tableWidth: tableW,
        didParseCell: (data) => applyCellColor(data, grouped),
      } as any);

      const table1Bottom = (doc as any).lastAutoTable.finalY;

      autoTable(doc, {
        startX: col2X,
        startY,
        head: [['Cut across repetition']],
        body: grouped.map((r) => [`${r.lengthMm} ${r.qtyAcrossRepetition} pcs`]),
        theme: 'plain',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [229, 231, 235], fontStyle: 'bold', textColor: [55, 65, 81] },
        columnStyles: { 0: { cellWidth: tableW - 8 } },
        margin: { left: 0 },
        tableWidth: tableW,
        didParseCell: (data) => applyCellColor(data, grouped),
      } as any);

      const table2Bottom = (doc as any).lastAutoTable.finalY;
      startY = Math.max(table1Bottom, table2Bottom) + 10;

      // Visual bar
      const barW = pageW - 2 * margin - 2 * cardPadding;
      const barH = 10;
      let barX = margin + cardPadding;
      const barY = startY;

      layout.cuts.forEach((c) => {
        const segW = (c.length / stockLength) * barW;
        const [r, g, b] = c.elementColor ? hexToRgb(c.elementColor) : [107, 158, 182];
        doc.setFillColor(r, g, b);
        doc.setDrawColor(100, 116, 139); // 1px solid outline (slate-600)
        doc.setLineWidth(0.35); // ~1px
        doc.rect(barX, barY, segW, barH, 'FD');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(c.unit, barX + segW / 2, barY + barH / 2 + 1.5, { align: 'center' });
        doc.setTextColor(55, 65, 81);
        barX += segW;
      });

      if (layout.offCut > 0) {
        const offcutW = (layout.offCut / stockLength) * barW;
        // Light grey dotted pattern for off-cut
        doc.setFillColor(226, 232, 240);
        doc.rect(barX, barY, offcutW, barH, 'F');
        doc.setFillColor(203, 213, 225);
        for (let i = 0; i < offcutW; i += 4) {
          for (let j = 0; j < barH; j += 4) {
            doc.rect(barX + i, barY + j, 1.5, 1.5, 'F');
          }
        }
      }

      startY += barH + 8;
    });
  });

  // Footer
  doc.setFillColor(55, 65, 81);
  doc.rect(0, pageH - footerHeight, pageW, footerHeight, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);

  const footerContent = quoteFormat.footer?.content?.trim();
  if (footerContent) {
    const parts = footerContent.split(/\n|\|/).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      doc.text(parts[0], margin, pageH - footerHeight / 2 - 1, { align: 'left' });
      doc.text(parts[1], pageW / 2, pageH - footerHeight / 2 - 1, { align: 'center' });
      doc.text(parts[2], pageW - margin, pageH - footerHeight / 2 - 1, { align: 'right' });
    } else if (parts.length === 2) {
      doc.text(parts[0], margin, pageH - footerHeight / 2 - 1, { align: 'left' });
      doc.text(parts[1], pageW - margin, pageH - footerHeight / 2 - 1, { align: 'right' });
    } else if (parts.length === 1) {
      doc.text(parts[0], pageW / 2, pageH - footerHeight / 2 - 1, { align: 'center' });
    }
  }

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
  sections: CuttingListSection[],
  projectName: string
) => {
  const wsData: (string | number)[][] = [
    ['Cutting List'],
    [],
    ['Project:', projectName],
    ['Date:', new Date().toLocaleDateString()],
    [],
  ];

  sections.forEach((section) => {
    wsData.push([`Profile: ${section.profileName}`]);
    wsData.push(['Material Length:', `${section.materialLength} meters`]);
    wsData.push(['Quantity:', `${section.totalQuantity} length`]);
    wsData.push([]);
    wsData.push(['Layout', 'Repetition', 'Cuts', 'Off-cut (m)']);
    section.layouts.forEach((layout) => {
      wsData.push([
        layout.layout,
        `${layout.repetition}X`,
        layout.cuts.map(c => c.elementTitle ? `${c.length}${c.unit} (${c.elementTitle})` : `${c.length}${c.unit}`).join(', '),
        layout.offCut
      ]);
    });
    wsData.push([]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 30 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Cutting List');
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
    elementTitle?: string;
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

    // Cuts Table (include Element column when any cut has elementTitle)
    const hasElement = layout.cuts.some((c) => c.elementTitle);
    const tableData = layout.cuts.map((cut) =>
      hasElement
        ? [`${cut.w}mm`, `${cut.h}mm`, cut.qty, cut.elementTitle ?? '']
        : [`${cut.w}mm`, `${cut.h}mm`, cut.qty]
    );
    const tableHead = hasElement ? [['Width', 'Height', 'Quantity', 'Element']] : [['Width', 'Height', 'Quantity']];

    autoTable(doc, {
      startY: startY,
      head: tableHead,
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

  const hasElement = layouts.some((layout) => layout.cuts.some((c) => c.elementTitle));

  // Add data for each sheet
  layouts.forEach((layout) => {
    wsData.push([]);
    wsData.push([`Sheet ${layout.sheetNumber}`]);
    wsData.push([`Sheet Type: ${layout.sheetType}`]);
    wsData.push([`Dimensions: ${layout.sheetWidth}mm x ${layout.sheetHeight}mm`]);
    wsData.push([`Total Cuts: ${layout.totalCuts}`]);
    wsData.push([]);
    wsData.push(hasElement ? ['Width (mm)', 'Height (mm)', 'Quantity', 'Element'] : ['Width (mm)', 'Height (mm)', 'Quantity']);
    layout.cuts.forEach((cut) => {
      if (hasElement) {
        wsData.push([cut.w, cut.h, cut.qty, cut.elementTitle ?? '']);
      } else {
        wsData.push([cut.w, cut.h, cut.qty]);
      }
    });
  });

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = hasElement
    ? [{ wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }]
    : [{ wch: 15 }, { wch: 15 }, { wch: 12 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Glass Cutting List');

  // Save file
  XLSX.writeFile(wb, `Glass-Cutting-List-${projectName.replace(/\s+/g, '-')}.xlsx`);
};

export const shareData = async (
  type: 'material' | 'cutting',
  data: string | { text?: string; [key: string]: unknown },
  projectName: string
) => {
  const shareText = typeof data === 'string' ? data : (data?.text as string) || JSON.stringify(data, null, 2);
  const displayText = typeof data === 'string' ? data : (data?.text as string) || `View the ${type} list for project: ${projectName}`;

  // Check if Web Share API is available
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${type === 'material' ? 'Material List' : 'Cutting List'} - ${projectName}`,
        text: displayText,
        url: window.location.href
      });
      return { success: true, message: 'Shared successfully' };
    } catch (error) {
      console.error('Error sharing:', error);
      return { success: false, message: 'Share cancelled or failed' };
    }
  } else {
    // Fallback: Copy to clipboard
    const clipboardText = type === 'material'
      ? `Material List for ${projectName}\n\n${shareText}`
      : `Cutting List for ${projectName}\n\n${shareText}`;

    try {
      await navigator.clipboard.writeText(clipboardText);
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

