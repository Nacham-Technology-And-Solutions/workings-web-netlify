import type { CalculationResult, NetListResult, NetListCut, ScrewTotal } from '@/types/calculations';
import { normalizeGlassListResult } from '@/utils/glassLayout';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function parseNetListCuts(raw: unknown): NetListCut[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = asRecord(row);
      if (!r) return null;
      const w = Number(r.w);
      const h = Number(r.h);
      const qty = Number(r.qty);
      if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(qty)) return null;
      return { w, h, qty };
    })
    .filter((c): c is NetListCut => c !== null);
}

function parseNetList(raw: unknown): NetListResult | undefined {
  const nl = asRecord(raw);
  if (!nl) return undefined;

  const cuts = parseNetListCuts(nl.cuts);
  const rollRaw = asRecord(nl.netRoll);
  const netRoll =
    rollRaw && Number.isFinite(Number(rollRaw.widthMm)) && Number.isFinite(Number(rollRaw.lengthMm))
      ? { widthMm: Number(rollRaw.widthMm), lengthMm: Number(rollRaw.lengthMm) }
      : undefined;

  const result: NetListResult = {
    cuts,
    roll_type: typeof nl.roll_type === 'string' ? nl.roll_type : undefined,
    total_rolls: typeof nl.total_rolls === 'number' ? nl.total_rolls : undefined,
    total_area_m2: typeof nl.total_area_m2 === 'number' ? nl.total_area_m2 : undefined,
    required_length_m: typeof nl.required_length_m === 'number' ? nl.required_length_m : undefined,
    netRoll,
  };

  if (cuts.length === 0 && !result.roll_type && result.total_rolls == null) {
    return undefined;
  }
  return result;
}

function parseScrewTotals(raw: unknown): ScrewTotal[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = asRecord(row);
      if (!r || typeof r.name !== 'string') return null;
      const qty = Number(r.qty);
      if (!Number.isFinite(qty)) return null;
      return { name: r.name, qty };
    })
    .filter((s): s is ScrewTotal => s !== null);
}

function parseWarnings(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((w): w is string => typeof w === 'string' && w.trim().length > 0);
}

/** Normalize API calculation result (calculate or lastCalculationResult). */
export function parseCalculationResult(raw: unknown): CalculationResult {
  const data = asRecord(raw) ?? {};

  const materialList = Array.isArray(data.materialList) ? data.materialList : [];
  const cuttingList = Array.isArray(data.cuttingList) ? data.cuttingList : [];
  const rubberTotals = Array.isArray(data.rubberTotals) ? data.rubberTotals : [];
  const accessoryTotals = Array.isArray(data.accessoryTotals) ? data.accessoryTotals : [];
  const elements = Array.isArray(data.elements) ? data.elements : [];
  const screwTotals = parseScrewTotals(data.screwTotals);
  const warnings = parseWarnings(data.warnings);
  const netList = parseNetList(data.netList);

  const glassListRaw =
    data.glassList && typeof data.glassList === 'object'
      ? data.glassList
      : { sheet_type: '', total_sheets: 0, cuts: [] };

  return {
    materialList,
    cuttingList,
    glassList: normalizeGlassListResult(glassListRaw as Parameters<typeof normalizeGlassListResult>[0]),
    rubberTotals,
    accessoryTotals,
    screwTotals,
    warnings,
    netList,
    elements,
  };
}

/** Total net pane count from netList.cuts (sum of qty). */
export function getNetPaneCount(netList?: NetListResult | null): number {
  return netList?.cuts?.reduce((sum, c) => sum + c.qty, 0) ?? 0;
}

export function hasNetCuttingData(netList?: NetListResult | null): boolean {
  return getNetPaneCount(netList) > 0;
}

/** Display metres for rubber/spline lines (3 dp for spline per integration doc). */
export function formatRubberMeters(name: string, meters: number): string {
  const dp = name.toLowerCase().includes('spline') ? 3 : 2;
  return meters.toFixed(dp);
}
