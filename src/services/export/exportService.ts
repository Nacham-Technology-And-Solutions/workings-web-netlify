import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTemplateStore } from '@/stores/templateStore';
import type { GlassPlacement } from '@/types/calculations';

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

/** Hex to RGB tuple [r,g,b] for jsPDF — supports #RGB and #RRGGBB */
function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace('#', '').trim();
  if (raw.length === 3 && /^[a-f\d]{3}$/i.test(raw)) {
    return [
      parseInt(raw[0] + raw[0], 16),
      parseInt(raw[1] + raw[1], 16),
      parseInt(raw[2] + raw[2], 16),
    ];
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(raw);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [107, 158, 182];
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
      const innerLeft = margin + cardPadding;
      const innerW = pageW - 2 * margin - 2 * cardPadding;

      // Card background (white cards like destination)
      const estimatedCardH = 68 + grouped.length * 11 + 30;
      doc.setDrawColor(229, 231, 235);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, cardTop - 2, pageW - 2 * margin, estimatedCardH, 2, 2, 'FD');

      // Summary: grey bar + Layout / Repetition / Off-cuts (jspdf-autotable v5 has no startX — use one table or draw)
      const summaryBarH = 12;
      doc.setFillColor(243, 244, 246);
      doc.rect(innerLeft, startY, innerW, summaryBarH, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(107, 114, 128);
      const sumCol1 = innerLeft + 4;
      const sumCol2 = innerLeft + innerW * 0.36;
      const sumCol3 = innerLeft + innerW * 0.68;
      doc.text('Layout', sumCol1, startY + 8);
      doc.text('Repetition', sumCol2, startY + 8);
      doc.text('Off-cuts', sumCol3, startY + 8);
      startY += summaryBarH + 2;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text(layout.layout, sumCol1, startY + 5);
      doc.text(`${layout.repetition}X`, sumCol2, startY + 5);
      doc.text(`${layout.offCut.toFixed(1)}m`, sumCol3, startY + 5);
      startY += 12;

      // Single two-column table — avoids v5 ignoring startX (dual tables both sat at margin.left: 0 and overlapped)
      const tableMargin = { left: innerLeft, right: margin + cardPadding, top: 0, bottom: 0 };
      const cutTableDidParseCell = (data: any) => {
        if (data.section === 'body' && (data.column.index === 0 || data.column.index === 1)) {
          const rowIdx = data.row.index;
          const color = grouped[rowIdx]?.elementColor;
          const [r, g, b] = color ? hexToRgb(color) : [147, 197, 253];
          data.cell.styles.fillColor = [r, g, b];
          data.cell.styles.textColor = [255, 255, 255];
        }
      };

      autoTable(doc, {
        startY,
        head: [['Cut/Length', 'Cut across repetition']],
        body: grouped.map((r) => [
          `${r.lengthMm} ${r.qtyPerBar} pcs`,
          `${r.lengthMm} ${r.qtyAcrossRepetition} pcs`,
        ]),
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [229, 231, 235], fontStyle: 'bold', textColor: [55, 65, 81] },
        columnStyles: {
          0: { cellWidth: innerW / 2 - 1 },
          1: { cellWidth: innerW / 2 - 1 },
        },
        margin: tableMargin,
        tableWidth: innerW,
        didParseCell: cutTableDidParseCell,
      } as any);

      startY = (doc as any).lastAutoTable.finalY + 8;

      // Dashed rule above stock bar (matches in-app cutting list)
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.3);
      if (typeof doc.setLineDashPattern === 'function') {
        doc.setLineDashPattern([1.2, 1.2], 0);
      }
      doc.line(innerLeft, startY, innerLeft + innerW, startY);
      if (typeof doc.setLineDashPattern === 'function') {
        doc.setLineDashPattern([], 0);
      }
      startY += 6;

      // Visual bar
      const barW = innerW;
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

/** Enriched placement for export (colors + labels). */
export interface GlassExportPlacement extends GlassPlacement {
  fillHex?: string;
  elementTitle?: string;
}

export interface GlassCuttingLayout {
  sheetNumber: number;
  sheetType: string;
  sheetWidth: number;
  sheetHeight: number;
  cuts: Array<{
    w: number;
    h: number;
    qty: number;
    elementTitle?: string;
    elementId?: string;
  }>;
  totalCuts: number;
  layoutId?: string;
  /** Per physical sheet — drives nest diagram, CSV allotment, PDF panel table */
  placements?: GlassExportPlacement[];
}

function escapeCsvCell(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Aggregate piece placements on one sheet for the “Panel / Qty” table. */
function aggregatePanelsOnSheet(placements: GlassExportPlacement[]): Array<{
  w: number;
  h: number;
  qty: number;
  elementTitle: string;
}> {
  const pieces = placements.filter((p) => p.kind === 'piece');
  const key = (p: GlassExportPlacement) =>
    `${Math.round(p.widthMm)}x${Math.round(p.heightMm)}|${p.elementId ?? ''}|${Math.round(p.nominalWidthMm ?? 0)}x${Math.round(p.nominalHeightMm ?? 0)}`;
  const map = new Map<string, { w: number; h: number; qty: number; elementTitle: string }>();
  pieces.forEach((p) => {
    const k = key(p);
    const title = p.elementTitle ?? p.elementId ?? '';
    const cur = map.get(k);
    if (cur) cur.qty += 1;
    else map.set(k, { w: Math.round(p.widthMm), h: Math.round(p.heightMm), qty: 1, elementTitle: title });
  });
  return Array.from(map.values()).sort((a, b) => b.qty - a.qty || b.w * b.h - a.w * a.h);
}

function sheetPieceStats(placements: GlassExportPlacement[]): {
  pieceCount: number;
  cutLengthMm: number;
  pieceAreaMm2: number;
} {
  const pieces = placements.filter((p) => p.kind === 'piece');
  let cutLengthMm = 0;
  let pieceAreaMm2 = 0;
  pieces.forEach((p) => {
    const w = p.widthMm;
    const h = p.heightMm;
    cutLengthMm += 2 * (w + h);
    pieceAreaMm2 += w * h;
  });
  return { pieceCount: pieces.length, cutLengthMm, pieceAreaMm2 };
}

function drawGlassNestOnPdf(
  doc: jsPDF,
  placements: GlassExportPlacement[],
  stockW: number,
  stockH: number,
  originX: number,
  originY: number,
  boxW: number,
  boxH: number
): number {
  const s = Math.min(boxW / stockW, boxH / stockH);
  const usedW = stockW * s;
  const usedH = stockH * s;
  doc.setDrawColor(107, 114, 128);
  doc.setLineWidth(0.35);
  doc.setFillColor(229, 231, 235);
  doc.rect(originX, originY, usedW, usedH, 'FD');

  const ordered = [
    ...placements.filter((p) => p.kind === 'waste'),
    ...placements.filter((p) => p.kind === 'piece'),
  ];

  ordered.forEach((p) => {
    const x = originX + p.xMm * s;
    const y = originY + p.yMm * s;
    const rw = Math.max(0.1, p.widthMm * s);
    const rh = Math.max(0.1, p.heightMm * s);
    const hex = p.fillHex ?? (p.kind === 'waste' ? '#D1D5DB' : '#C8DEE5');
    const [r, g, b] = hexToRgb(hex);
    doc.setFillColor(r, g, b);
    doc.setDrawColor(75, 85, 99);
    doc.setLineWidth(0.15);
    doc.rect(x, y, rw, rh, 'FD');

    if (p.kind === 'piece' && rw > 2.5 && rh > 2.5) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(17, 24, 39);
      const dimW = String(Math.round(p.widthMm));
      const dimH = String(Math.round(p.heightMm));
      doc.text(dimW, x + rw / 2, y + Math.max(2.2, rh * 0.12), { align: 'center' });
      doc.text(dimH, x + Math.max(1.8, rw * 0.1), y + rh / 2, { align: 'center', angle: 90 });
      const lab = (p.elementTitle ?? p.elementId ?? '').trim();
      if (lab && rw > 10 && rh > 6) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.text(lab.length > 22 ? `${lab.slice(0, 21)}…` : lab, x + rw / 2, y + rh / 2 + 2.2, { align: 'center' });
        doc.setFont('helvetica', 'normal');
      }
      doc.setTextColor(0, 0, 0);
    }
  });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text(String(Math.round(stockW)), originX + usedW / 2, originY + usedH + 5, { align: 'center' });
  doc.text(String(Math.round(stockH)), originX - 4, originY + usedH / 2, { align: 'center', angle: 90 });
  doc.setTextColor(0, 0, 0);
  return usedH;
}

export const exportGlassCuttingListToCSV = (layouts: GlassCuttingLayout[], projectName: string) => {
  const date = new Date().toLocaleDateString();
  const headers = [
    'Project',
    'Date',
    'SheetNumber',
    'LayoutId',
    'StockWidthMm',
    'StockHeightMm',
    'PlacementKind',
    'PlacementIndex',
    'Xmm',
    'Ymm',
    'WidthMm',
    'HeightMm',
    'ElementId',
    'ElementTitle',
    'Rotated',
    'NominalWidthMm',
    'NominalHeightMm',
    'PiecesOnSheet',
  ];
  const lines: string[] = [headers.map(escapeCsvCell).join(',')];

  layouts.forEach((layout) => {
    const base = {
      project: projectName,
      date,
      sheet: layout.sheetNumber,
      layoutId: layout.layoutId ?? '',
      sw: layout.sheetWidth,
      sh: layout.sheetHeight,
    };
    if (layout.placements && layout.placements.length > 0) {
      layout.placements.forEach((p, idx) => {
        lines.push(
          [
            base.project,
            base.date,
            base.sheet,
            base.layoutId,
            base.sw,
            base.sh,
            p.kind,
            idx,
            Math.round(p.xMm * 1000) / 1000,
            Math.round(p.yMm * 1000) / 1000,
            Math.round(p.widthMm * 1000) / 1000,
            Math.round(p.heightMm * 1000) / 1000,
            p.elementId ?? '',
            p.elementTitle ?? '',
            p.rotated ? 'yes' : '',
            p.nominalWidthMm != null ? Math.round(p.nominalWidthMm) : '',
            p.nominalHeightMm != null ? Math.round(p.nominalHeightMm) : '',
            '',
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      });
      lines.push(
        [
          base.project,
          base.date,
          base.sheet,
          base.layoutId,
          base.sw,
          base.sh,
          'SHEET_SUMMARY',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          layout.totalCuts,
        ]
          .map(escapeCsvCell)
          .join(',')
        );
    } else {
      lines.push(
        [
          base.project,
          base.date,
          base.sheet,
          base.layoutId,
          base.sw,
          base.sh,
          'NO_LAYOUT_GEOMETRY',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          layout.totalCuts,
        ]
          .map(escapeCsvCell)
          .join(',')
        );
    }
  });

  const csvBody = `\uFEFF${lines.join('\r\n')}`;
  const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Glass-Cutting-List-${projectName.replace(/\s+/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportGlassCuttingListToPDF = (
  layouts: GlassCuttingLayout[],
  projectName: string
) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Glass cutting plan', margin, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, margin, 26);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 32);
  doc.text(`Total physical sheets: ${layouts.length}`, margin, 38);

  const first = layouts[0];
  if (first) {
    doc.setFont('helvetica', 'bold');
    doc.text('Required stock', margin, 46);
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
      startY: 49,
      head: [['Stock (W × H mm)', 'Sheets']],
      body: [[`${first.sheetWidth} × ${first.sheetHeight}`, String(layouts.length)]],
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' },
      margin: { left: margin, right: margin },
    });
  }

  const docWithTable = doc as { lastAutoTable?: { finalY: number } };
  let cursorY = (docWithTable.lastAutoTable?.finalY ?? 58) + 12;

  const ensureSpace = (neededMm: number) => {
    const pageH = doc.internal.pageSize.getHeight();
    if (cursorY + neededMm > pageH - 12) {
      doc.addPage();
      cursorY = margin;
    }
  };

  layouts.forEach((layout) => {
    const hasNest = layout.placements && layout.placements.length > 0;
    const panelRows = hasNest ? aggregatePanelsOnSheet(layout.placements!) : [];
    const stats = hasNest ? sheetPieceStats(layout.placements!) : { pieceCount: layout.totalCuts, cutLengthMm: 0, pieceAreaMm2: 0 };
    if (stats.cutLengthMm === 0 && !hasNest) {
      layout.cuts.forEach((c) => {
        stats.cutLengthMm += 2 * (c.w + c.h) * c.qty;
        stats.pieceAreaMm2 += c.w * c.h * c.qty;
      });
    }

    const blockMinH = hasNest ? 115 : 55;
    ensureSpace(blockMinH);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Sheet ${layout.sheetNumber}${layout.layoutId ? ` — Pattern ${layout.layoutId}` : ''}`, margin, cursorY);
    cursorY += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Stock: ${layout.sheetWidth} × ${layout.sheetHeight} mm  ·  Repeat: 1×  ·  Type: ${layout.sheetType}`, margin, cursorY);
    cursorY += 5;

    if (hasNest) {
      const diagramW = pageW - margin * 2;
      const diagramH = Math.min(95, diagramW * (layout.sheetHeight / layout.sheetWidth));
      drawGlassNestOnPdf(
        doc,
        layout.placements!,
        layout.sheetWidth,
        layout.sheetHeight,
        margin,
        cursorY,
        diagramW,
        diagramH
      );
      cursorY += diagramH + 10;

      const hasEl = panelRows.some((r) => r.elementTitle);
      autoTable(doc, {
        startY: cursorY,
        head: [hasEl ? ['Panel (W × H mm)', 'Qty', 'Element'] : ['Panel (W × H mm)', 'Qty']],
        body: hasEl
          ? panelRows.map((r) => [`${r.w} × ${r.h}`, String(r.qty), r.elementTitle])
          : panelRows.map((r) => [`${r.w} × ${r.h}`, String(r.qty)]),
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
      });
      cursorY = docWithTable.lastAutoTable!.finalY + 6;
      doc.setFontSize(9);
      doc.text(
        `Length of cuts (piece perimeter sum): ${Math.round(stats.cutLengthMm).toLocaleString()} mm  ·  Number of cuts: ${stats.pieceCount}`,
        margin,
        cursorY
      );
      cursorY += 8;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text('Nesting geometry not available for this sheet — BOM summary below.', margin, cursorY);
      doc.setTextColor(0, 0, 0);
      cursorY += 6;
      const hasElement = layout.cuts.some((c) => c.elementTitle);
      const tableData = layout.cuts.map((cut) =>
        hasElement
          ? [`${cut.w} × ${cut.h}`, cut.qty, cut.elementTitle ?? '']
          : [`${cut.w} × ${cut.h}`, cut.qty]
      );
      autoTable(doc, {
        startY: cursorY,
        head: hasElement ? [['Panel (W × H mm)', 'Qty', 'Element']] : [['Panel (W × H mm)', 'Qty']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
      });
      cursorY = docWithTable.lastAutoTable!.finalY + 8;
    }

    cursorY += 4;
  });

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
    if (layout.layoutId) {
      wsData.push([`Pattern: ${layout.layoutId}`]);
    }
    wsData.push([`Sheet Type: ${layout.sheetType}`]);
    wsData.push([`Dimensions: ${layout.sheetWidth}mm x ${layout.sheetHeight}mm`]);
    wsData.push([`Pieces on sheet: ${layout.totalCuts}`]);
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

