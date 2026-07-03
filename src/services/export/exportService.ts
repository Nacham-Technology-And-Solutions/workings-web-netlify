import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTemplateStore } from '@/stores/templateStore';
import { getPdfAppLogo, preloadPdfAppLogo, type PdfAppLogo } from '@/utils/pdfAppLogo';
import { applyPdfWatermarks } from '@/utils/pdfBranding';
import {
  drawPdfHeaderBrandingSync,
  resolveExportHeaderBranding,
  resolveExportCompanyName,
  type ExportHeaderBranding,
} from '@/utils/pdfExportBranding';
import {
  ensurePdfUnicodeFonts,
  setPdfUnicodeFont,
  pdfTableFontStyles,
  pdfTableHeadFontStyles,
  pdfAutoTableUnicodeHooks,
} from '@/utils/pdfFonts';
import { formatNairaForPdf } from '@/utils/formatters';
import { formatExportDate } from '@/utils/exportFileNaming';
import type { GlassPlacement, NetListCut } from '@/types/calculations';
import type { DimensionItem } from '@/types/project';
import { SLIDING_SASH_OPTIONS, isSlidingGlazingType } from '@/utils/slidingWindow';

preloadPdfAppLogo();

/** One project cart line for PDF cover tables (cutting / glass exports). */
export interface ProjectCartExportRow {
  index: number;
  name: string;
  type: string;
  dimensions: string;
  quantity: string;
  panels?: string;
  color?: string;
}

export interface ProjectExportCoverInfo {
  projectName: string;
  customerName?: string;
  siteAddress?: string;
  rows: ProjectCartExportRow[];
}

export function buildProjectCartExportRows(
  dimensions: DimensionItem[],
  unit = 'mm'
): ProjectCartExportRow[] {
  return dimensions.map((dim, i) => {
    let panels: string | undefined;
    if (isSlidingGlazingType(dim.type)) {
      const sashLabel = SLIDING_SASH_OPTIONS.find((opt) => opt.value === dim.sash)?.label;
      if (sashLabel) {
        panels = dim.fixedNet ? `${sashLabel} + fixed net` : sashLabel;
      }
    } else if (dim.panel && dim.panel !== '1') {
      panels = dim.panel;
    } else if (dim.openingPanels) {
      panels = `${dim.openingPanels} opening`;
    } else if (dim.verticalPanels && dim.horizontalPanels) {
      panels = `${dim.verticalPanels}×${dim.horizontalPanels}`;
    }

    return {
      index: i + 1,
      name: dim.title?.trim() || `Item ${i + 1}`,
      type: dim.type || '—',
      dimensions: `${dim.width} × ${dim.height} ${unit}`,
      quantity: dim.quantity || '1',
      panels,
      color: dim.color,
    };
  });
}

/** Page 1 cover: document title + project cart table. */
function drawProjectCartCoverPage(
  doc: jsPDF,
  documentTitle: string,
  cover: ProjectExportCoverInfo,
  headerBranding: ExportHeaderBranding
): void {
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  let startY = 20;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text(documentTitle, margin, startY);
  drawPdfHeaderBrandingSync(doc, pageW, margin, startY, headerBranding);
  startY += 14;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${cover.projectName}`, margin, startY);
  startY += 6;
  if (cover.customerName?.trim()) {
    doc.text(`Customer: ${cover.customerName.trim()}`, margin, startY);
    startY += 6;
  }
  if (cover.siteAddress?.trim()) {
    const site =
      cover.siteAddress.length > 72
        ? `${cover.siteAddress.slice(0, 71)}…`
        : cover.siteAddress.trim();
    doc.text(`Site: ${site}`, margin, startY);
    startY += 6;
  }
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, startY);
  startY += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Project cart', margin, startY);
  startY += 4;

  const hasPanels = cover.rows.some((r) => r.panels);
  const hasColor = cover.rows.some((r) => r.color);
  const head = hasPanels
    ? hasColor
      ? ['#', 'Name', 'Type', 'Dimensions', 'Qty', 'Panels', 'Color']
      : ['#', 'Name', 'Type', 'Dimensions', 'Qty', 'Panels']
    : hasColor
      ? ['#', 'Name', 'Type', 'Dimensions', 'Qty', 'Color']
      : ['#', 'Name', 'Type', 'Dimensions', 'Qty'];

  const body = cover.rows.map((row) => {
    const base = [String(row.index), row.name, row.type, row.dimensions, row.quantity];
    if (hasPanels) base.push(row.panels ?? '—');
    if (hasColor) base.push(row.color ?? '');
    return base;
  });

  const colorColIndex = head.indexOf('Color');

  autoTable(doc, {
    startY,
    head: [head],
    body,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold', textColor: 255 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 32 },
      3: { cellWidth: 38 },
      ...(colorColIndex >= 0 ? { [colorColIndex]: { cellWidth: 14, halign: 'center' } } : {}),
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (colorColIndex >= 0 && data.section === 'body' && data.column.index === colorColIndex) {
        data.cell.text = [];
      }
    },
    didDrawCell: (data) => {
      if (colorColIndex < 0 || data.section !== 'body' || data.column.index !== colorColIndex) return;
      const hex = cover.rows[data.row.index]?.color;
      if (!hex) return;
      const [r, g, b] = hexToRgb(hex);
      doc.setFillColor(r, g, b);
      doc.setDrawColor(209, 213, 219);
      const cx = data.cell.x + data.cell.width / 2;
      const cy = data.cell.y + data.cell.height / 2;
      doc.circle(cx, cy, 2, 'FD');
    },
  } as any);
}

function formatElementWithColorLabel(title: string): string {
  return title;
}

function drawElementColorDot(doc: jsPDF, x: number, y: number, color?: string): void {
  if (!color) return;
  const [r, g, b] = hexToRgb(color);
  doc.setFillColor(r, g, b);
  doc.setDrawColor(209, 213, 219);
  doc.circle(x, y, 1.6, 'FD');
}

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
  const dateStr = formatExportDate(dateFormat);

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

export interface MaterialListExportRow {
  name: string;
  quantity: number;
  unit: string;
  /** Display string when unit alone is insufficient (e.g. `4 sets (16 pcs)`). */
  quantityDisplay?: string;
  unitPrice?: number;
  total?: number;
}

export interface MaterialListExportSection {
  title: string;
  rows: MaterialListExportRow[];
}

export type MaterialListExportMode = 'bom' | 'priced';

function materialListExportFilename(projectName: string, mode: MaterialListExportMode, ext: string): string {
  const slug = projectName.replace(/\s+/g, '-');
  return mode === 'bom' ? `Material-List-BOM-${slug}.${ext}` : `Material-List-${slug}.${ext}`;
}

/** Export calculation material list with Profiles / Accessories sections. */
export const exportProjectMaterialListToPDF = async (
  sections: MaterialListExportSection[],
  projectName: string,
  customerName: string,
  grandTotal: number,
  mode: MaterialListExportMode
) => {
  const workingsLogo = await getPdfAppLogo();
  const headerBranding = await resolveExportHeaderBranding(true);
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const headerY = 20;
  await ensurePdfUnicodeFonts(doc);
  const priced = mode === 'priced';

  doc.setFontSize(22);
  setPdfUnicodeFont(doc, 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('MATERIAL LIST', margin, headerY);
  drawPdfHeaderBrandingSync(doc, pageW, margin, headerY, headerBranding);

  doc.setFontSize(10);
  setPdfUnicodeFont(doc, 'normal');
  doc.text(`Project: ${projectName}`, margin, 34);
  if (customerName) {
    doc.text(`Customer: ${customerName}`, margin, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 46);
  } else {
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 40);
  }

  let startY = customerName ? 54 : 48;

  sections.forEach((section) => {
    if (!section.rows.length) return;

    doc.setFontSize(11);
    setPdfUnicodeFont(doc, 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(section.title, 14, startY);
    startY += 6;

    const tableData = section.rows.map((row, index) => {
      const qtyCell = row.quantityDisplay ?? `${row.quantity} ${row.unit}`;
      if (priced) {
        return [
          index + 1,
          row.name,
          qtyCell,
          row.unit,
          formatNairaForPdf(row.unitPrice ?? 0),
          formatNairaForPdf(row.total ?? 0),
        ];
      }
      return [index + 1, row.name, qtyCell];
    });

    autoTable(doc, {
      startY,
      head: priced
        ? [['S/N', 'Item', 'Quantity', 'Unit', 'Unit Price', 'Total']]
        : [['S/N', 'Item', 'Quantity']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, ...pdfTableFontStyles() },
      headStyles: { fillColor: [55, 65, 81], ...pdfTableHeadFontStyles() },
      bodyStyles: pdfTableFontStyles(),
      ...pdfAutoTableUnicodeHooks(),
    });

    startY = ((doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY) + 10;
  });

  if (priced) {
    doc.setFontSize(12);
    setPdfUnicodeFont(doc, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Grand Total: ${formatNairaForPdf(grandTotal)}`, 14, startY);
  }

  applyPdfWatermarks(doc, workingsLogo);
  doc.save(materialListExportFilename(projectName, mode, 'pdf'));
};

export const exportProjectMaterialListToExcel = (
  sections: MaterialListExportSection[],
  projectName: string,
  customerName: string,
  grandTotal: number,
  mode: MaterialListExportMode
) => {
  const priced = mode === 'priced';
  const wsData: (string | number)[][] = [
    ['Material List'],
    [],
    ['Project:', projectName],
    ['Customer:', customerName || '—'],
    ['Date:', new Date().toLocaleDateString()],
    [],
  ];

  sections.forEach((section) => {
    if (!section.rows.length) return;
    wsData.push([section.title]);
    wsData.push(
      priced
        ? ['S/N', 'Item', 'Quantity', 'Unit', 'Unit Price (₦)', 'Total (₦)']
        : ['S/N', 'Item', 'Quantity']
    );
    section.rows.forEach((row, index) => {
      const qtyCell = row.quantityDisplay ?? `${row.quantity} ${row.unit}`;
      if (priced) {
        wsData.push([
          index + 1,
          row.name,
          qtyCell,
          row.unit,
          row.unitPrice ?? 0,
          row.total ?? 0,
        ]);
      } else {
        wsData.push([index + 1, row.name, qtyCell]);
      }
    });
    wsData.push([]);
  });

  if (priced) {
    wsData.push(['', '', '', '', 'Grand Total:', grandTotal]);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = priced
    ? [{ wch: 6 }, { wch: 28 }, { wch: 18 }, { wch: 10 }, { wch: 15 }, { wch: 15 }]
    : [{ wch: 6 }, { wch: 28 }, { wch: 18 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Material List');
  XLSX.writeFile(wb, materialListExportFilename(projectName, mode, 'xlsx'));
};

export interface CuttingLayout {
  id?: string;
  layout: string;
  repetition: number;
  cuts: {
    length: number;
    lengthMm?: number;
    diagramLabel?: string;
    unit: string;
    elementTitle?: string;
    elementColor?: string;
  }[];
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

export const exportMaterialListToPDF = async (
  materials: MaterialItem[],
  projectName: string,
  customerName: string,
  grandTotal: number
) => {
  const workingsLogo = await getPdfAppLogo();
  const headerBranding = await resolveExportHeaderBranding(true);
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const headerY = 20;
  await ensurePdfUnicodeFonts(doc);

  doc.setFontSize(22);
  setPdfUnicodeFont(doc, 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('MATERIAL LIST', margin, headerY);
  drawPdfHeaderBrandingSync(doc, pageW, margin, headerY, headerBranding);

  doc.setFontSize(10);
  setPdfUnicodeFont(doc, 'normal');
  doc.text(`Project: ${projectName}`, margin, 34);
  doc.text(`Customer: ${customerName}`, margin, 40);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 46);

  const tableData = materials.map((item, index) => [
    index + 1,
    item.name,
    item.quantity,
    item.unit,
    formatNairaForPdf(item.unitPrice),
    formatNairaForPdf(item.total),
  ]);

  autoTable(doc, {
    startY: 54,
    head: [['S/N', 'Item', 'Quantity', 'Unit', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9, ...pdfTableFontStyles() },
    headStyles: { fillColor: [55, 65, 81], ...pdfTableHeadFontStyles() },
    bodyStyles: pdfTableFontStyles(),
    ...pdfAutoTableUnicodeHooks(),
  });

  const finalY = (doc as any).lastAutoTable.finalY || 54;
  doc.setFontSize(12);
  setPdfUnicodeFont(doc, 'bold');
  doc.text(`Grand Total: ${formatNairaForPdf(grandTotal)}`, 14, finalY + 10);

  applyPdfWatermarks(doc, workingsLogo);
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
export const exportFullMaterialListToPDF = async (
  items: FullMaterialListItem[],
  projectName: string,
  preparedBy: string,
  grandTotal: number,
  date?: string
) => {
  const workingsLogo = await getPdfAppLogo();
  const headerBranding = await resolveExportHeaderBranding(true);
  const materials: MaterialItem[] = items.map((item) => ({
    id: item.id,
    name: item.description,
    quantity: item.quantity,
    unit: 'pcs',
    unitPrice: item.unitPrice,
    total: item.total,
  }));
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const headerY = 20;
  await ensurePdfUnicodeFonts(doc);

  doc.setFontSize(22);
  setPdfUnicodeFont(doc, 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('MATERIAL LIST', margin, headerY);
  drawPdfHeaderBrandingSync(doc, pageW, margin, headerY, headerBranding);

  doc.setFontSize(10);
  setPdfUnicodeFont(doc, 'normal');
  doc.text(`Project: ${projectName}`, margin, 34);
  doc.text(`Prepared by: ${preparedBy}`, margin, 40);
  doc.text(`Date: ${date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString()}`, margin, 46);

  const tableData = materials.map((item, index) => [
    index + 1,
    item.name,
    item.quantity,
    item.unit,
    formatNairaForPdf(item.unitPrice),
    formatNairaForPdf(item.total),
  ]);

  autoTable(doc, {
    startY: 54,
    head: [['S/N', 'Description', 'Quantity', 'Unit', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9, ...pdfTableFontStyles() },
    headStyles: { fillColor: [55, 65, 81], ...pdfTableHeadFontStyles() },
    bodyStyles: pdfTableFontStyles(),
    ...pdfAutoTableUnicodeHooks(),
  });

  const finalY = (doc as any).lastAutoTable.finalY || 54;
  doc.setFontSize(12);
  setPdfUnicodeFont(doc, 'bold');
  doc.text(`Grand Total: ${formatNairaForPdf(grandTotal)}`, 14, finalY + 10);

  applyPdfWatermarks(doc, workingsLogo);
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
function groupCutsForTables(
  cuts: CuttingLayout['cuts'],
  repetition: number
) {
  const map = new Map<string, { lengthMm: number; qtyPerBar: number; elementTitle?: string; elementColor?: string }>();
  cuts.forEach((c) => {
    const lengthMm = c.lengthMm ?? Math.round(c.length * 1000);
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

function formatCuttingBarLabelM(lengthMeters: number): string {
  return `${lengthMeters.toFixed(1)}m`;
}

function formatOffcutSummaryM(offcutMeters: number): string {
  const mm = Math.max(0, Math.round(offcutMeters * 1000));
  return `${formatLengthMmDisplay(mm)}mm (${offcutMeters.toFixed(1)}m)`;
}

function formatLengthMmDisplay(lengthMm: number): string {
  return Math.round(lengthMm).toLocaleString('en-US');
}

/** Draw column header + bordered rows (dot, length mm, N pcs) — matches docs/cutting-list-page.tsx */
function drawCutColumnTable(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  rows: { lengthMm: number; qty: number; elementColor?: string }[]
): number {
  const headerH = 7;
  const rowH = 7;
  const rowGap = 2;

  doc.setFillColor(237, 237, 237);
  doc.setDrawColor(237, 237, 237);
  doc.roundedRect(x, y, width, headerH, 1, 1, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(84, 84, 84);
  doc.text(title, x + 3, y + 4.8);

  let rowY = y + headerH + 2;
  rows.forEach((row) => {
    doc.setDrawColor(237, 237, 237);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, rowY, width, rowH, 1, 1, 'FD');

    const [r, g, b] = row.elementColor ? hexToRgb(row.elementColor) : [34, 197, 94];
    doc.setFillColor(r, g, b);
    doc.circle(x + 4.5, rowY + rowH / 2, 1.4, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(formatLengthMmDisplay(row.lengthMm), x + 9, rowY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(`${row.qty} pcs`, x + width - 3, rowY + 4.8, { align: 'right' });

    rowY += rowH + rowGap;
  });

  return rowY;
}

/** Shared X positions for Layout / Repetition / Off-cuts — left-clustered columns (matches docs/cutting-list-page.tsx gap-20). */
function cuttingListLayoutColumns(margin: number, contentWidth: number) {
  const pad = 6;
  const colWidth = 28;
  const layoutX = margin + pad;
  const repetitionX = layoutX + colWidth;
  const offcutsX = repetitionX + colWidth;
  const tablesX = Math.min(offcutsX + colWidth + 10, margin + contentWidth * 0.52);
  return { layoutX, repetitionX, offcutsX, tablesX };
}

/** Page-level column guide (Layout | Repetition | Off-cuts) */
function drawCuttingListColumnGuide(doc: jsPDF, margin: number, y: number, contentWidth: number): number {
  const cols = cuttingListLayoutColumns(margin, contentWidth);
  const h = 8;
  doc.setFillColor(237, 237, 237);
  doc.roundedRect(margin, y, contentWidth, h, 1.5, 1.5, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(84, 84, 84);
  doc.text('Layout', cols.layoutX, y + 5.5);
  doc.text('Repetition', cols.repetitionX, y + 5.5);
  doc.text('Off-cuts', cols.offcutsX, y + 5.5);
  return y + h + 4;
}

function formatMaterialLengthMeters(meters: number): string {
  const s = meters.toFixed(2);
  return s.replace(/\.?0+$/, '') || '0';
}

function formatStockQuantityLabel(qty: number): string {
  return qty === 1 ? '1 length' : `${qty} lengths`;
}

function drawCuttingListDocumentHeader(
  doc: jsPDF,
  pageW: number,
  margin: number,
  projectName: string,
  startY: number,
  logoEnabled: boolean,
  headerBranding: ExportHeaderBranding
): number {
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('CUTTING LIST', margin, startY);
  if (logoEnabled) {
    drawPdfHeaderBrandingSync(doc, pageW, margin, startY, headerBranding);
  }
  startY += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, margin, startY);
  startY += 6;
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, startY);
  return startY + 10;
}

function drawProfileCuttingSectionHeader(
  doc: jsPDF,
  margin: number,
  pageW: number,
  section: CuttingListSection,
  startY: number
): number {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(section.profileName, margin, startY);
  startY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.text(
    `Material Length: ${formatMaterialLengthMeters(section.materialLength)} meters | Total Quantity: ${formatStockQuantityLabel(section.totalQuantity)}`,
    margin,
    startY
  );
  return startY + 10;
}

export const exportCuttingListToPDF = async (
  sections: CuttingListSection[],
  projectName: string,
  cover?: ProjectExportCoverInfo
) => {
  const workingsLogo = await getPdfAppLogo();
  const headerBranding = await resolveExportHeaderBranding(true);
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const footerHeight = 12;
  const contentBottom = pageH - footerHeight;

  const quoteFormat = useTemplateStore.getState().quoteFormat;
  const logoEnabled = true;

  if (cover?.rows?.length) {
    drawProjectCartCoverPage(doc, 'CUTTING LIST', {
      ...cover,
      projectName: cover.projectName || projectName,
    }, headerBranding);
    doc.addPage();
  }

  let startY = 20;

  sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) {
      doc.addPage();
      startY = 20;
    }

    if (sectionIndex === 0) {
      const showDocumentLogo = logoEnabled && !(cover?.rows?.length);
      startY = drawCuttingListDocumentHeader(doc, pageW, margin, projectName, startY, showDocumentLogo, headerBranding);
    }

    startY = drawProfileCuttingSectionHeader(doc, margin, pageW, section, startY);
    const contentWidth = pageW - 2 * margin;
    startY = drawCuttingListColumnGuide(doc, margin, startY, contentWidth);

    section.layouts.forEach((layout, layoutIndex) => {
      if (layoutIndex > 0 && startY > contentBottom - 100) {
        doc.addPage();
        startY = 20;
      } else if (layoutIndex > 0) {
        startY += 8;
      }

      const stockLength = layout.stockLength ?? section.materialLength;
      const cardPadding = 6;
      const grouped = groupCutsForTables(layout.cuts, layout.repetition);
      const cols = cuttingListLayoutColumns(margin, contentWidth);
      const innerLeft = margin + cardPadding;
      const innerW = contentWidth - 2 * cardPadding;
      const tableGap = 6;
      const tablesRight = margin + contentWidth - cardPadding;
      const tableW = (tablesRight - cols.tablesX - tableGap) / 2;
      const rowCount = grouped.length;
      const tableBlockH = 7 + 2 + rowCount * (7 + 2);
      const cardContentH = Math.max(22, tableBlockH) + 8 + 10 + 8;
      const estimatedCardH = cardContentH + cardPadding * 2;

      if (startY + estimatedCardH > contentBottom) {
        doc.addPage();
        startY = 20;
      }

      const cardY = startY;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.35);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, cardY - 2, contentWidth, estimatedCardH, 2, 2, 'FD');

      const contentY = cardY + cardPadding;
      const metaRowY = contentY + 5;

      // Layout row — aligned under column guide (Layout | Repetition | Off-cuts)
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(layout.layout, cols.layoutX, metaRowY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(68, 68, 68);
      doc.text(`${layout.repetition}X`, cols.repetitionX, metaRowY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(formatOffcutSummaryM(layout.offCut), cols.offcutsX, metaRowY);

      // Right: Cut/Length + Cut across repetition tables
      const cutRows = grouped.map((r) => ({
        lengthMm: r.lengthMm,
        qty: r.qtyPerBar,
        elementColor: r.elementColor,
      }));
      const acrossRows = grouped.map((r) => ({
        lengthMm: r.lengthMm,
        qty: r.qtyAcrossRepetition,
        elementColor: r.elementColor,
      }));
      const tablesEndY = Math.max(
        drawCutColumnTable(doc, cols.tablesX, contentY, tableW, 'Cut/Length', cutRows),
        drawCutColumnTable(doc, cols.tablesX + tableW + tableGap, contentY, tableW, 'Cut across repetition', acrossRows)
      );

      // Dashed rule above stock bar
      let barSectionY = tablesEndY + 4;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      if (typeof doc.setLineDashPattern === 'function') {
        doc.setLineDashPattern([1.2, 1.2], 0);
      }
      doc.line(innerLeft, barSectionY, innerLeft + innerW, barSectionY);
      if (typeof doc.setLineDashPattern === 'function') {
        doc.setLineDashPattern([], 0);
      }
      barSectionY += 6;

      // Visual bar
      const barW = innerW;
      const barH = 10;
      let barX = innerLeft;
      const barY = barSectionY;

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.rect(innerLeft, barY, barW, barH, 'S');

      layout.cuts.forEach((c) => {
        const segW = (c.length / stockLength) * barW;
        const [r, g, b] = c.elementColor ? hexToRgb(c.elementColor) : [107, 158, 182];
        doc.setFillColor(r, g, b);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.35);
        doc.rect(barX, barY, segW, barH, 'FD');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const label = c.unit || formatCuttingBarLabelM(c.length);
        const textR = r * 0.299 + g * 0.587 + b * 0.114;
        doc.setTextColor(textR > 160 ? 31 : 255, textR > 160 ? 41 : 255, textR > 160 ? 55 : 255);
        doc.text(label, barX + segW / 2, barY + barH / 2 + 1.5, { align: 'center' });
        barX += segW;
      });

      if (layout.offCut > 0) {
        const offcutW = (layout.offCut / stockLength) * barW;
        doc.setFillColor(255, 255, 255);
        doc.rect(barX, barY, offcutW, barH, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.35);
        doc.rect(barX, barY, offcutW, barH, 'S');
        doc.setFillColor(203, 213, 225);
        for (let i = 0; i < offcutW; i += 3) {
          for (let j = 0; j < barH; j += 3) {
            doc.circle(barX + i + 0.5, barY + j + 0.5, 0.4, 'F');
          }
        }
      }

      startY = barY + barH + cardPadding + 6;
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

  applyPdfWatermarks(doc, workingsLogo);
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
    wsData.push(['Layout', 'Repetition', 'Cuts', 'Off-cut']);
    section.layouts.forEach((layout) => {
      wsData.push([
        layout.layout,
        `${layout.repetition}X`,
        layout.cuts.map(c => c.elementTitle ? `${c.length}${c.unit} (${c.elementTitle})` : `${c.length}${c.unit}`).join(', '),
        formatOffcutSummaryM(layout.offCut),
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
    elementColor?: string;
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
  elementColor?: string;
}> {
  const pieces = placements.filter((p) => p.kind === 'piece');
  const key = (p: GlassExportPlacement) =>
    `${Math.round(p.widthMm)}x${Math.round(p.heightMm)}|${p.elementId ?? ''}|${Math.round(p.nominalWidthMm ?? 0)}x${Math.round(p.nominalHeightMm ?? 0)}`;
  const map = new Map<string, { w: number; h: number; qty: number; elementTitle: string; elementColor?: string }>();
  pieces.forEach((p) => {
    const k = key(p);
    const title = p.elementTitle ?? p.elementId ?? '';
    const color = p.fillHex && p.kind === 'piece' ? p.fillHex : undefined;
    const cur = map.get(k);
    if (cur) cur.qty += 1;
    else map.set(k, { w: Math.round(p.widthMm), h: Math.round(p.heightMm), qty: 1, elementTitle: title, elementColor: color });
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

export const exportGlassCuttingListToPDF = async (
  layouts: GlassCuttingLayout[],
  projectName: string,
  cover?: ProjectExportCoverInfo
) => {
  const workingsLogo = await getPdfAppLogo();
  const headerBranding = await resolveExportHeaderBranding(true);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  const first = layouts[0];
  const docWithTable = doc as { lastAutoTable?: { finalY: number } };

  if (cover?.rows?.length) {
    drawProjectCartCoverPage(doc, 'GLASS CUTTING PLAN', {
      ...cover,
      projectName: cover.projectName || projectName,
    }, headerBranding);

    if (first) {
      let stockY = (docWithTable.lastAutoTable?.finalY ?? 120) + 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Required stock', margin, stockY);
      stockY += 4;
      doc.setFont('helvetica', 'normal');
      autoTable(doc, {
        startY: stockY,
        head: [['Stock (W × H mm)', 'Sheets']],
        body: [[`${first.sheetWidth} × ${first.sheetHeight}`, String(layouts.length)]],
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
      });
    }

    doc.addPage();
  }

  let cursorY = margin;

  if (!cover?.rows?.length) {
    const titleY = 20;
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text('GLASS CUTTING PLAN', margin, titleY);
    drawPdfHeaderBrandingSync(doc, pageW, margin, titleY, headerBranding);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${projectName}`, margin, 34);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 40);
    doc.text(`Total physical sheets: ${layouts.length}`, margin, 46);

    if (first) {
      doc.setFont('helvetica', 'bold');
      doc.text('Required stock', margin, 54);
      doc.setFont('helvetica', 'normal');
      autoTable(doc, {
        startY: 57,
        head: [['Stock (W × H mm)', 'Sheets']],
        body: [[`${first.sheetWidth} × ${first.sheetHeight}`, String(layouts.length)]],
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
      });
    }

    cursorY = (docWithTable.lastAutoTable?.finalY ?? 66) + 12;
  } else {
    const titleY = cursorY;
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text('GLASS CUTTING PLAN', margin, titleY);
    drawPdfHeaderBrandingSync(doc, pageW, margin, titleY, headerBranding);
    cursorY += 14;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${projectName}`, margin, cursorY);
    cursorY += 6;
    doc.text(`Total physical sheets: ${layouts.length}`, margin, cursorY);
    cursorY += 10;
  }

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
      const elementColIndex = hasEl ? 2 : -1;
      autoTable(doc, {
        startY: cursorY,
        head: [hasEl ? ['Panel (W × H mm)', 'Qty', 'Element'] : ['Panel (W × H mm)', 'Qty']],
        body: hasEl
          ? panelRows.map((r) => [`${r.w} × ${r.h}`, String(r.qty), formatElementWithColorLabel(r.elementTitle)])
          : panelRows.map((r) => [`${r.w} × ${r.h}`, String(r.qty)]),
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: { left: hasEl ? 8 : 3, top: 2, right: 3, bottom: 2 } },
        headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
        didParseCell: (data) => {
          if (hasEl && data.section === 'body' && data.column.index === elementColIndex) {
            const row = panelRows[data.row.index];
            if (row?.elementColor) data.cell.text = [];
          }
        },
        didDrawCell: (data) => {
          if (!hasEl || data.section !== 'body' || data.column.index !== elementColIndex) return;
          const row = panelRows[data.row.index];
          if (!row?.elementColor) return;
          drawElementColorDot(doc, data.cell.x + 3, data.cell.y + data.cell.height / 2, row.elementColor);
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          doc.text(row.elementTitle, data.cell.x + 7, data.cell.y + data.cell.height / 2 + 1);
        },
      } as any);
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
      const cutsWithColor = layout.cuts as Array<{
        w: number;
        h: number;
        qty: number;
        elementTitle?: string;
        elementColor?: string;
      }>;
      const tableData = cutsWithColor.map((cut) =>
        hasElement
          ? [`${cut.w} × ${cut.h}`, cut.qty, formatElementWithColorLabel(cut.elementTitle ?? '')]
          : [`${cut.w} × ${cut.h}`, cut.qty]
      );
      autoTable(doc, {
        startY: cursorY,
        head: hasElement ? [['Panel (W × H mm)', 'Qty', 'Element']] : [['Panel (W × H mm)', 'Qty']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: { left: hasElement ? 8 : 3, top: 2, right: 3, bottom: 2 } },
        headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
        didParseCell: (data) => {
          if (hasElement && data.section === 'body' && data.column.index === 2) {
            const cut = cutsWithColor[data.row.index];
            if (cut?.elementColor) data.cell.text = [];
          }
        },
        didDrawCell: (data) => {
          if (!hasElement || data.section !== 'body' || data.column.index !== 2) return;
          const cut = cutsWithColor[data.row.index];
          if (!cut?.elementColor) return;
          drawElementColorDot(doc, data.cell.x + 3, data.cell.y + data.cell.height / 2, cut.elementColor);
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          doc.text(cut.elementTitle ?? '', data.cell.x + 7, data.cell.y + data.cell.height / 2 + 1);
        },
      } as any);
      cursorY = docWithTable.lastAutoTable!.finalY + 8;
    }

    cursorY += 4;
  });

  applyPdfWatermarks(doc, workingsLogo);
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

export interface NetCuttingListExportData {
  cuts: NetListCut[];
  totalPanes: number;
  rollType?: string;
  totalRolls?: number;
  totalAreaM2?: number;
  requiredLengthM?: number;
  purchaseSummary?: string;
}

function sortedNetCuts(cuts: NetListCut[]): NetListCut[] {
  return [...cuts].sort((a, b) => b.w * b.h - a.w * a.h);
}

function netCuttingFileBase(projectName: string): string {
  return `Net-Cutting-List-${projectName.replace(/\s+/g, '-')}`;
}

export const exportNetCuttingListToCSV = (
  data: NetCuttingListExportData,
  projectName: string
) => {
  const date = new Date().toLocaleDateString();
  const lines: string[] = [
    ['Project', projectName].map(escapeCsvCell).join(','),
    ['Date', date].map(escapeCsvCell).join(','),
    ['Total panes', data.totalPanes].map(escapeCsvCell).join(','),
  ];
  if (data.rollType) {
    lines.push(['Roll type', data.rollType].map(escapeCsvCell).join(','));
  }
  if (data.totalRolls != null) {
    lines.push(['Total rolls', data.totalRolls].map(escapeCsvCell).join(','));
  }
  if (data.purchaseSummary) {
    lines.push(['Purchase', data.purchaseSummary].map(escapeCsvCell).join(','));
  }
  if (data.totalAreaM2 != null) {
    lines.push(['Total area (m²)', data.totalAreaM2.toFixed(2)].map(escapeCsvCell).join(','));
  }
  if (data.requiredLengthM != null) {
    lines.push(['Required length (m)', data.requiredLengthM.toFixed(2)].map(escapeCsvCell).join(','));
  }
  lines.push('');
  lines.push(['Width (mm)', 'Height (mm)', 'Qty'].map(escapeCsvCell).join(','));
  sortedNetCuts(data.cuts).forEach((cut) => {
    lines.push([cut.w, cut.h, cut.qty].map(escapeCsvCell).join(','));
  });

  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${netCuttingFileBase(projectName)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportNetCuttingListToExcel = (
  data: NetCuttingListExportData,
  projectName: string
) => {
  const wsData: (string | number)[][] = [
    ['Net Cutting List'],
    [],
    ['Project:', projectName],
    ['Date:', new Date().toLocaleDateString()],
    ['Total panes:', data.totalPanes],
  ];
  if (data.rollType) wsData.push(['Roll type:', data.rollType]);
  if (data.totalRolls != null) wsData.push(['Total rolls:', data.totalRolls]);
  if (data.purchaseSummary) wsData.push(['Purchase:', data.purchaseSummary]);
  if (data.totalAreaM2 != null) wsData.push(['Total area (m²):', data.totalAreaM2.toFixed(2)]);
  if (data.requiredLengthM != null) wsData.push(['Required length (m):', data.requiredLengthM.toFixed(2)]);
  wsData.push([], ['Width (mm)', 'Height (mm)', 'Qty']);
  sortedNetCuts(data.cuts).forEach((cut) => {
    wsData.push([cut.w, cut.h, cut.qty]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Net Cutting List');
  XLSX.writeFile(wb, `${netCuttingFileBase(projectName)}.xlsx`);
};

export const exportNetCuttingListToPDF = async (
  data: NetCuttingListExportData,
  projectName: string,
  cover?: ProjectExportCoverInfo
) => {
  const workingsLogo = await getPdfAppLogo();
  const headerBranding = await resolveExportHeaderBranding(true);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const docWithTable = doc as { lastAutoTable?: { finalY: number } };

  if (cover?.rows?.length) {
    drawProjectCartCoverPage(doc, 'NET CUTTING LIST', {
      ...cover,
      projectName: cover.projectName || projectName,
    }, headerBranding);
    doc.addPage();
  }

  let startY = 20;
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('NET CUTTING LIST', margin, startY);
  if (!cover?.rows?.length) {
    drawPdfHeaderBrandingSync(doc, pageW, margin, startY, headerBranding);
  }
  startY += 14;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, margin, startY);
  startY += 6;
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, startY);
  startY += 6;
  doc.text(`Total panes: ${data.totalPanes}`, margin, startY);
  startY += 6;
  if (data.rollType) {
    doc.text(`Roll type: ${data.rollType}`, margin, startY);
    startY += 6;
  }
  if (data.totalRolls != null) {
    doc.text(`Total rolls: ${data.totalRolls}`, margin, startY);
    startY += 6;
  }
  if (data.purchaseSummary) {
    doc.text(`Purchase: ${data.purchaseSummary}`, margin, startY);
    startY += 6;
  }
  if (data.totalAreaM2 != null) {
    doc.text(`Total area: ${data.totalAreaM2.toFixed(2)} m²`, margin, startY);
    startY += 6;
  }
  if (data.requiredLengthM != null) {
    doc.text(`Required length: ${data.requiredLengthM.toFixed(2)} m`, margin, startY);
    startY += 6;
  }
  startY += 4;

  autoTable(doc, {
    startY,
    head: [['Width (mm)', 'Height (mm)', 'Qty']],
    body: sortedNetCuts(data.cuts).map((cut) => [
      cut.w.toLocaleString(),
      cut.h.toLocaleString(),
      String(cut.qty),
    ]),
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  });

  applyPdfWatermarks(doc, workingsLogo);
  doc.save(`${netCuttingFileBase(projectName)}.pdf`);
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
  paymentTerms?: string;
  customPaymentTerms?: string;
  additionalNotes?: string;
}

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  'due-on-receipt': 'Due on Receipt',
  'net-7': 'Net 7 (Due 7 days after quote date)',
  'net-30': 'Net 30 (Due 30 days after invoice date)',
  '50-50': '50% Deposit, 50% on Completion',
  '30-70': '30% Upfront, 70% on Delivery',
};

function formatPaymentTermsForPdf(paymentTerms?: string, customPaymentTerms?: string): string | null {
  if (!paymentTerms) return null;
  if (paymentTerms === 'customize' && customPaymentTerms?.trim()) {
    return customPaymentTerms.trim();
  }
  return PAYMENT_TERMS_LABELS[paymentTerms] ?? paymentTerms;
}

/**
 * Export quote to PDF
 */
export const exportQuoteToPDF = async (quote: QuoteData) => {
  const pdfConfig = useTemplateStore.getState().pdfExport.quote;
  const workingsLogo = await getPdfAppLogo();
  const headerBranding = await resolveExportHeaderBranding(pdfConfig.logo.enabled);
  const fileNamingConfig = useTemplateStore.getState().pdfExport.fileNaming;
  const paymentMethodConfig = useTemplateStore.getState().paymentMethodConfig;
  const quoteFormat = useTemplateStore.getState().quoteFormat;

  // Get page size
  const pageSize = getPageSize(pdfConfig.pageSize, pdfConfig.customSize);
  
  // Create PDF document with configured page size and orientation
  const doc = new jsPDF({
    orientation: pdfConfig.orientation,
    unit: 'mm',
    format: pageSize,
  });
  await ensurePdfUnicodeFonts(doc);
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const headerTitleY = 20;

  let currentY = pdfConfig.header.enabled ? pdfConfig.header.height : headerTitleY;

  // Header section (if enabled)
  if (pdfConfig.header.enabled) {
    const displayCompanyName = quoteFormat.header.companyName || resolveExportCompanyName();

    if (displayCompanyName) {
      doc.setFontSize(pdfConfig.fonts.headingSize);
      setPdfUnicodeFont(doc, 'bold');
      doc.setTextColor(pdfConfig.fonts.headingColor);
      doc.text(displayCompanyName, margin, headerTitleY);
      if (pdfConfig.logo.enabled) {
        drawPdfHeaderBrandingSync(doc, pageW, margin, headerTitleY, headerBranding);
      }
      currentY = 30;

      if (quoteFormat.header.tagline) {
        doc.setFontSize(pdfConfig.fonts.bodySize);
        setPdfUnicodeFont(doc, 'normal');
        doc.text(quoteFormat.header.tagline, margin, currentY);
        currentY += 10;
      }
    } else {
      doc.setFontSize(pdfConfig.fonts.headingSize);
      setPdfUnicodeFont(doc, 'bold');
      doc.setTextColor(pdfConfig.fonts.headingColor);
      doc.text('QUOTE', margin, headerTitleY);
      if (pdfConfig.logo.enabled) {
        drawPdfHeaderBrandingSync(doc, pageW, margin, headerTitleY, headerBranding);
      }
      currentY = 30;
    }
  } else {
    currentY = headerTitleY;
    doc.setFontSize(pdfConfig.fonts.headingSize);
    setPdfUnicodeFont(doc, 'bold');
    doc.text('QUOTE', margin, headerTitleY);
    if (pdfConfig.logo.enabled) {
      drawPdfHeaderBrandingSync(doc, pageW, margin, headerTitleY, headerBranding);
    }
    currentY = 30;
  }

  // Quote Info
  setPdfUnicodeFont(doc, 'normal');
  doc.setFontSize(pdfConfig.fonts.bodySize);
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
  const paymentTermsText = formatPaymentTermsForPdf(quote.paymentTerms, quote.customPaymentTerms);
  if (paymentTermsText) {
    doc.text(`Payment Terms: ${paymentTermsText}`, 14, currentY);
    currentY += 6;
  }
  currentY += 4;

  // Items Table
  const tableData = quote.items.map((item, index) => [
    index + 1,
    item.description,
    item.quantity,
    formatNairaForPdf(item.unitPrice),
    formatNairaForPdf(item.total),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['S/N', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: { 
      fontSize: pdfConfig.fonts.tableSize,
      ...pdfTableFontStyles({ textColor: pdfConfig.fonts.bodyColor }),
    },
    headStyles: { 
      fillColor: [55, 65, 81] as [number, number, number],
      ...pdfTableHeadFontStyles({ textColor: [255, 255, 255] }),
    },
    bodyStyles: pdfTableFontStyles({ textColor: pdfConfig.fonts.bodyColor }),
    ...pdfAutoTableUnicodeHooks(),
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY || currentY;
  currentY = finalY + 10;

  setPdfUnicodeFont(doc, 'normal');
  doc.setFontSize(pdfConfig.fonts.bodySize);
  doc.setTextColor(pdfConfig.fonts.bodyColor);
  doc.text(`Subtotal: ${formatNairaForPdf(quote.summary.subtotal)}`, 14, currentY);
  currentY += 6;

  // Charges
  quote.summary.charges.forEach(charge => {
    doc.text(`${charge.label}: ${formatNairaForPdf(charge.amount)}`, 14, currentY);
    currentY += 6;
  });

  // Grand Total
  currentY += 3;
  doc.setFontSize(pdfConfig.fonts.headingSize);
  setPdfUnicodeFont(doc, 'bold');
  doc.setTextColor(pdfConfig.fonts.headingColor);
  doc.text(`Grand Total: ${formatNairaForPdf(quote.summary.grandTotal)}`, 14, currentY);
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
  applyPdfWatermarks(doc, workingsLogo);
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

