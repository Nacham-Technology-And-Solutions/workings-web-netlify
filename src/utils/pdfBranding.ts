import type jsPDF from 'jspdf';
import type { PdfAppLogo } from '@/utils/pdfAppLogo';

const WATERMARK_OPACITY = 0.12;
const WATERMARK_MAX_W = 22;
const WATERMARK_MAX_H = 14;
const HEADER_MAX_W = 36;
const HEADER_MAX_H = 22;

const LOGO_SIZE_MM = {
  small: { maxW: 28, maxH: 16 },
  medium: { maxW: HEADER_MAX_W, maxH: HEADER_MAX_H },
  large: { maxW: 48, maxH: 28 },
} as const;

export type PdfLogoPosition = 'top-left' | 'top-center' | 'top-right';
export type PdfLogoSize = 'small' | 'medium' | 'large';

function logoDimensions(
  logo: PdfAppLogo,
  maxW: number,
  maxH: number
): { w: number; h: number } {
  const aspect = logo.width / logo.height;
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  return { w, h };
}

function withImageOpacity(doc: jsPDF, opacity: number, draw: () => void): void {
  const gStateCtor = (doc as jsPDF & { GState?: new (opts: { opacity: number }) => unknown }).GState;
  if (gStateCtor) {
    doc.saveGraphicsState();
    doc.setGState(new gStateCtor({ opacity }) as never);
    draw();
    doc.restoreGraphicsState();
    return;
  }
  draw();
}

/** Full logo — page 1 only, top-right, top edge aligned with the title cap height. */
export function drawPdfHeaderLogo(
  doc: jsPDF,
  pageW: number,
  margin: number,
  titleBaselineY: number,
  logo: PdfAppLogo | null
): void {
  if (!logo) return;

  const { w, h } = logoDimensions(logo, HEADER_MAX_W, HEADER_MAX_H);
  const x = pageW - margin - w;
  const titleTopY = titleBaselineY - doc.getTextDimensions('Mg').h;
  doc.addImage(logo.dataUrl, 'PNG', x, titleTopY, w, h);
}

/** Logo placement within a header band — used by quote PDF export. */
export function drawPdfHeaderLogoPositioned(
  doc: jsPDF,
  pageW: number,
  marginLeft: number,
  marginRight: number,
  headerTopY: number,
  headerHeight: number,
  logo: PdfAppLogo | null,
  position: PdfLogoPosition,
  size: PdfLogoSize
): void {
  if (!logo) return;

  const { maxW, maxH } = LOGO_SIZE_MM[size];
  const { w, h } = logoDimensions(logo, maxW, maxH);
  const centerY = headerTopY + Math.max(headerHeight, h) / 2;
  const y = centerY - h / 2;

  let x: number;
  if (position === 'top-left') {
    x = marginLeft;
  } else if (position === 'top-center') {
    x = (pageW - w) / 2;
  } else {
    x = pageW - marginRight - w;
  }

  doc.addImage(logo.dataUrl, 'PNG', x, y, w, h);
}

/** Small transparent logo — every page, lower-left. */
export function drawPdfWatermarkLogo(
  doc: jsPDF,
  margin: number,
  pageH: number,
  logo: PdfAppLogo | null
): void {
  if (!logo) return;

  const { w, h } = logoDimensions(logo, WATERMARK_MAX_W, WATERMARK_MAX_H);
  const x = margin;
  const y = pageH - margin - h;

  withImageOpacity(doc, WATERMARK_OPACITY, () => {
    doc.addImage(logo.dataUrl, 'PNG', x, y, w, h);
  });
}

/** Apply watermark to every page (call once before save). Header logo is drawn during page-1 content setup. */
export function applyPdfWatermarks(doc: jsPDF, logo: PdfAppLogo | null): void {
  if (!logo) return;

  const margin = 14;
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    const pageH = doc.internal.pageSize.getHeight();
    drawPdfWatermarkLogo(doc, margin, pageH, logo);
  }
}
