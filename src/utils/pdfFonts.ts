import type jsPDF from 'jspdf';

/** jsPDF font family with Unicode support (Naira sign ₦). */
export const PDF_UNICODE_FONT = 'WorkingsSans';

const REGULAR_FILE = 'WorkingsSans-Regular.ttf';
const BOLD_FILE = 'WorkingsSans-Bold.ttf';

let regularBase64: string | null = null;
let boldBase64: string | null = null;
let fontDataPromise: Promise<void> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function loadFontData(): Promise<void> {
  if (regularBase64 && boldBase64) return;
  if (!fontDataPromise) {
    fontDataPromise = (async () => {
      const [regular, bold] = await Promise.all([
        fetch('/fonts/Roboto-Regular.ttf').then(async (r) => {
          if (!r.ok) throw new Error('Failed to load Roboto-Regular.ttf');
          return arrayBufferToBase64(await r.arrayBuffer());
        }),
        fetch('/fonts/Roboto-Bold.ttf').then(async (r) => {
          if (!r.ok) throw new Error('Failed to load Roboto-Bold.ttf');
          return arrayBufferToBase64(await r.arrayBuffer());
        }),
      ]);
      regularBase64 = regular;
      boldBase64 = bold;
    })().catch((error) => {
      fontDataPromise = null;
      throw error;
    });
  }
  await fontDataPromise;
}

/** Register Roboto on this document — required for ₦ in jsPDF + autoTable. */
export async function ensurePdfUnicodeFonts(doc: jsPDF): Promise<void> {
  await loadFontData();
  if (!regularBase64 || !boldBase64) return;

  doc.addFileToVFS(REGULAR_FILE, regularBase64);
  doc.addFileToVFS(BOLD_FILE, boldBase64);
  doc.addFont(REGULAR_FILE, PDF_UNICODE_FONT, 'normal');
  doc.addFont(BOLD_FILE, PDF_UNICODE_FONT, 'bold');
  doc.setFont(PDF_UNICODE_FONT, 'normal');
}

export function setPdfUnicodeFont(
  doc: jsPDF,
  style: 'normal' | 'bold' = 'normal'
): void {
  const fonts = doc.getFontList();
  if (fonts[PDF_UNICODE_FONT]) {
    doc.setFont(PDF_UNICODE_FONT, style);
  } else {
    doc.setFont('helvetica', style);
  }
}

export function pdfTableFontStyles(extra?: Record<string, unknown>): Record<string, unknown> {
  return { font: PDF_UNICODE_FONT, fontStyle: 'normal', ...extra };
}

export function pdfTableHeadFontStyles(extra?: Record<string, unknown>): Record<string, unknown> {
  return { font: PDF_UNICODE_FONT, fontStyle: 'bold', ...extra };
}

/** autoTable hook — force Unicode font on every cell (fixes ₦ in some PDF viewers). */
export function pdfAutoTableUnicodeHooks() {
  return {
    willDrawCell: (data: { doc: jsPDF; cell: { styles: Record<string, unknown> } }) => {
      data.cell.styles.font = PDF_UNICODE_FONT;
    },
  };
}
