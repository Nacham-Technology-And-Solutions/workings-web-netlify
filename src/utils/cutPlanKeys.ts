/**
 * Parse length (mm) from cutting-plan object keys, e.g. cut_1900mm, cut_518.33mm, waste_175mm.
 * Integer-only regexes (e.g. /(\d+)mm/) wrongly read 33 from cut_518.33mm.
 */
export function parseCutKeyLengthMm(cutKey: string): number {
  const match =
    cutKey.match(/_(\d+(?:\.\d+)?)\s*mm\s*$/i) ??
    cutKey.match(/(\d+(?:\.\d+)?)\s*mm\s*$/i);
  if (!match) return 0;
  const mm = parseFloat(match[1]);
  return Number.isFinite(mm) ? mm : 0;
}

/** Human-readable length for bar segments (supports sub-metre decimal mm from the engine). */
export function formatCutLengthLabel(lengthMm: number): string {
  if (!Number.isFinite(lengthMm) || lengthMm <= 0) return '0m';
  const meters = lengthMm / 1000;
  if (meters >= 1) {
    const oneDp = Math.round(meters * 10) / 10;
    return `${oneDp.toFixed(1)}m`;
  }
  const twoDp = Math.round(meters * 100) / 100;
  if (twoDp >= 0.1) {
    return `${twoDp.toFixed(2)}m`;
  }
  return `${Math.round(lengthMm)}mm`;
}
