import type { CuttingPlanPiece } from '@/types/calculations';

/** True if the plan key denotes offcut/waste (should use checker style, not colored). */
export function isOffcutKey(cutKey: string): boolean {
  const k = cutKey.toLowerCase();
  return k.startsWith('offcut_') || k.startsWith('waste_');
}

function isOffcutLabel(text: string): boolean {
  const k = text.toLowerCase();
  return k.includes('offcut') || k.includes('waste');
}

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

/** Prefer engine `cut` label (e.g. "540mm / 0.54m") when present. */
export function labelFromCutPiece(piece: CuttingPlanPiece, cutKey: string): string {
  if (piece.cut?.trim()) return piece.cut.trim();
  const lengthMm =
    piece.lengthMm != null && Number.isFinite(piece.lengthMm) && piece.lengthMm > 0
      ? piece.lengthMm
      : parseCutKeyLengthMm(cutKey);
  return lengthMm > 0 ? formatCutLengthLabel(lengthMm) : cutKey;
}

export function lengthMetersFromCutPiece(piece: CuttingPlanPiece, cutKey: string): number {
  if (piece.lengthMm != null && Number.isFinite(piece.lengthMm) && piece.lengthMm > 0) {
    return piece.lengthMm / 1000;
  }
  return parseCutKeyLengthMm(cutKey) / 1000;
}

/**
 * Normalize cutting plan entry to a list of cuts (legacy string[] or CuttingPlanPiece[]).
 * Cuts ordered largest→smallest; uses piece.cut / lengthMm when provided by the engine.
 */
export function normalizePlanEntryToCuts(planEntry: {
  [key: string]: string[] | CuttingPlanPiece[];
}): Array<{ length: number; label: string; elementId?: string; isOffcut?: boolean }> {
  const result: Array<{ length: number; label: string; elementId?: string; isOffcut?: boolean }> = [];
  const cutKeys = Object.keys(planEntry)
    .filter((key) => !isOffcutKey(key))
    .sort((a, b) => parseCutKeyLengthMm(b) - parseCutKeyLengthMm(a));

  cutKeys.forEach((cutKey) => {
    const raw = planEntry[cutKey];
    if (!Array.isArray(raw) || raw.length === 0) return;
    const isNewFormat = typeof raw[0] === 'object' && raw[0] !== null && 'cut' in (raw[0] as object);
    if (isNewFormat) {
      (raw as CuttingPlanPiece[]).forEach((piece) => {
        const label = labelFromCutPiece(piece, cutKey);
        const isOffcut = isOffcutLabel(label) || isOffcutLabel(piece.cut ?? '');
        result.push({
          length: lengthMetersFromCutPiece(piece, cutKey),
          label,
          elementId: piece.elementId,
          isOffcut,
        });
      });
    } else {
      const lengthMm = parseCutKeyLengthMm(cutKey);
      const lengthMeters = lengthMm / 1000;
      const label = lengthMm > 0 ? formatCutLengthLabel(lengthMm) : cutKey;
      (raw as string[]).forEach(() => {
        result.push({ length: lengthMeters, label, isOffcut: false });
      });
    }
  });
  return result;
}
