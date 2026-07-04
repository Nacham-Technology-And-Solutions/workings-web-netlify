import type jsPDF from 'jspdf';

export interface PdfPageMargins {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

/** Default margins for material list / legacy exports (mm). */
export const DEFAULT_PDF_MARGINS: PdfPageMargins = {
  top: 20,
  left: 14,
  right: 14,
  bottom: 22,
};

export function getPdfContentBottom(doc: jsPDF, bottomMargin: number): number {
  return doc.internal.pageSize.getHeight() - bottomMargin;
}

/** Start a new page when `currentY + neededHeight` would pass the bottom margin. */
export function ensurePdfPageSpace(
  doc: jsPDF,
  currentY: number,
  neededHeightMm: number,
  margins: PdfPageMargins
): number {
  if (currentY + neededHeightMm > getPdfContentBottom(doc, margins.bottom)) {
    doc.addPage();
    return margins.top;
  }
  return currentY;
}

export function autoTableMargins(margins: PdfPageMargins) {
  return {
    left: margins.left,
    right: margins.right,
    top: margins.top,
    bottom: margins.bottom,
  };
}
