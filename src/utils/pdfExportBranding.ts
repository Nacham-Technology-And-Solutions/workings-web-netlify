import type jsPDF from 'jspdf';
import type { PdfAppLogo } from '@/utils/pdfAppLogo';
import { drawPdfHeaderLogo } from '@/utils/pdfBranding';
import { getPdfAppLogo } from '@/utils/pdfAppLogo';
import { useTemplateStore } from '@/stores/templateStore';
import { useAuthStore } from '@/stores';

export type ExportHeaderBranding =
  | { type: 'image'; logo: PdfAppLogo }
  | { type: 'text'; companyName: string }
  | { type: 'workings'; logo: PdfAppLogo | null };

const logoRasterCache = new Map<string, PdfAppLogo>();

async function rasterizeImageUrl(imageUrl: string): Promise<PdfAppLogo | null> {
  const cached = logoRasterCache.get(imageUrl);
  if (cached) return cached;

  try {
    return await new Promise<PdfAppLogo | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const maxWidth = 440;
        const scale = maxWidth / (img.naturalWidth || maxWidth);
        const width = maxWidth;
        const height = Math.max(1, Math.round((img.naturalHeight || maxWidth) * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png');
        const logo = { dataUrl, width, height };
        logoRasterCache.set(imageUrl, logo);
        resolve(logo);
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
  } catch {
    return null;
  }
}

export function resolveEffectiveLogoUrl(): string | null {
  const { quoteFormat } = useTemplateStore.getState();
  const user = useAuthStore.getState().user;
  const source = quoteFormat.header.logoSource ?? 'none';

  if (source === 'company') {
    return user?.companyLogoUrl || null;
  }
  if (source === 'custom') {
    return quoteFormat.header.logoUrl || null;
  }
  return null;
}

export function resolveExportCompanyName(): string {
  const user = useAuthStore.getState().user;
  const { quoteFormat } = useTemplateStore.getState();
  return (user?.companyName || quoteFormat.header.companyName || '').trim();
}

export async function resolveExportHeaderBranding(logoEnabled = true): Promise<ExportHeaderBranding> {
  if (!logoEnabled) {
    return { type: 'workings', logo: await getPdfAppLogo() };
  }

  const logoUrl = resolveEffectiveLogoUrl();
  if (logoUrl) {
    const raster = await rasterizeImageUrl(logoUrl);
    if (raster) {
      return { type: 'image', logo: raster };
    }
  }

  const companyName = resolveExportCompanyName();
  if (companyName) {
    return { type: 'text', companyName };
  }

  return { type: 'workings', logo: await getPdfAppLogo() };
}

function wrapCompactCompanyName(doc: jsPDF, name: string, maxWidthMm: number): string[] {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = words[0] ?? '';

  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    if (doc.getTextWidth(candidate) <= maxWidthMm) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i] ?? '';
      if (lines.length >= 1) break;
    }
  }
  lines.push(current);

  if (lines.length > 2) {
    return lines.slice(0, 2);
  }

  if (lines.length === 1 && doc.getTextWidth(lines[0]!) > maxWidthMm) {
    let truncated = lines[0]!;
    while (truncated.length > 1 && doc.getTextWidth(`${truncated}…`) > maxWidthMm) {
      truncated = truncated.slice(0, -1);
    }
    return [`${truncated}…`];
  }

  if (lines.length === 2 && doc.getTextWidth(lines[1]!) > maxWidthMm) {
    let truncated = lines[1]!;
    while (truncated.length > 1 && doc.getTextWidth(`${truncated}…`) > maxWidthMm) {
      truncated = truncated.slice(0, -1);
    }
    lines[1] = `${truncated}…`;
  }

  return lines;
}

export function drawPdfHeaderCompanyName(
  doc: jsPDF,
  pageW: number,
  margin: number,
  titleBaselineY: number,
  companyName: string
): void {
  const maxWidthMm = 45;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);

  const lines = wrapCompactCompanyName(doc, companyName, maxWidthMm);
  if (lines.length === 0) return;

  const lineHeight = 3.5;
  const titleTopY = titleBaselineY - doc.getTextDimensions('Mg').h;
  const blockHeight = lines.length * lineHeight;
  let y = titleTopY + blockHeight - lineHeight;

  for (const line of lines) {
    const textWidth = doc.getTextWidth(line);
    const x = pageW - margin - textWidth;
    doc.text(line, x, y);
    y -= lineHeight;
  }
}

export async function drawPdfHeaderBranding(
  doc: jsPDF,
  pageW: number,
  margin: number,
  titleBaselineY: number,
  branding?: ExportHeaderBranding
): Promise<void> {
  const resolved = branding ?? (await resolveExportHeaderBranding());
  drawPdfHeaderBrandingSync(doc, pageW, margin, titleBaselineY, resolved);
}

export function drawPdfHeaderBrandingSync(
  doc: jsPDF,
  pageW: number,
  margin: number,
  titleBaselineY: number,
  branding: ExportHeaderBranding
): void {
  if (branding.type === 'image') {
    drawPdfHeaderLogo(doc, pageW, margin, titleBaselineY, branding.logo);
    return;
  }

  if (branding.type === 'text') {
    drawPdfHeaderCompanyName(doc, pageW, margin, titleBaselineY, branding.companyName);
    return;
  }

  drawPdfHeaderLogo(doc, pageW, margin, titleBaselineY, branding.logo);
}

export function migrateQuoteFormatLogoSource(
  header: { logoSource?: 'company' | 'custom' | 'none'; logoUrl?: string | null }
): 'company' | 'custom' | 'none' {
  if (header.logoSource) return header.logoSource;
  if (header.logoUrl) return 'custom';
  return 'none';
}
