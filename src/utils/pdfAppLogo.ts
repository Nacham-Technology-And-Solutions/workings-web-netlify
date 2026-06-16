/** App logo rasterized for jsPDF (SVG → PNG data URL). */
export interface PdfAppLogo {
  dataUrl: string;
  width: number;
  height: number;
}

const APP_LOGO_PATH = '/icons/app-secondary-logo.svg';
const RASTER_WIDTH_PX = 440;
let cached: PdfAppLogo | null = null;
let cachedPath: string | null = null;
let loadPromise: Promise<PdfAppLogo | null> | null = null;
async function rasterizeSvgToPng(svgUrl: string, targetWidthPx: number): Promise<PdfAppLogo | null> {
  try {
    const response = await fetch(svgUrl);
    if (!response.ok) return null;
    const svgText = await response.text();
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);

    return await new Promise<PdfAppLogo | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = targetWidthPx / (img.naturalWidth || targetWidthPx);
        const width = targetWidthPx;
        const height = Math.max(1, Math.round((img.naturalHeight || targetWidthPx) * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);
        resolve({ dataUrl: canvas.toDataURL('image/png'), width, height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });
  } catch {
    return null;
  }
}

export function getPdfAppLogo(): Promise<PdfAppLogo | null> {
  if (cached && cachedPath === APP_LOGO_PATH) return Promise.resolve(cached);
  if (!loadPromise || cachedPath !== APP_LOGO_PATH) {
    cached = null;
    cachedPath = APP_LOGO_PATH;
    loadPromise = rasterizeSvgToPng(APP_LOGO_PATH, RASTER_WIDTH_PX).then((result) => {
      cached = result;
      return result;
    });
  }
  return loadPromise;
}
/** Warm the logo cache so PDF export does not wait on first rasterize. */
export function preloadPdfAppLogo(): void {
  void getPdfAppLogo();
}
