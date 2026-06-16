import type {
  AccessoryTotal,
  CalculationResult,
  MaterialListItem,
  NetListResult,
  NetListCut,
  ScrewTotal,
} from '@/types/calculations';
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

const MATERIAL_LIST_TYPES: MaterialListItem['type'][] = [
  'Profile',
  'Accessory',
  'Accessory_Pair',
  'Sheet',
  'Roll',
  'Meter',
];

function parseMaterialList(raw: unknown): MaterialListItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row): MaterialListItem | null => {
      const r = asRecord(row);
      if (!r || typeof r.item !== 'string') return null;
      const units = Number(r.units);
      if (!Number.isFinite(units)) return null;
      const typeRaw = r.type;
      if (typeof typeRaw !== 'string' || !MATERIAL_LIST_TYPES.includes(typeRaw as MaterialListItem['type'])) {
        return null;
      }
      const item: MaterialListItem = {
        item: r.item,
        units,
        type: typeRaw as MaterialListItem['type'],
      };
      if (typeof r.unit === 'string' && r.unit.trim()) {
        item.unit = r.unit.trim();
      }
      if (r.unitPrice != null && Number.isFinite(Number(r.unitPrice))) {
        item.unitPrice = Number(r.unitPrice);
      }
      if (r.totalPrice != null && Number.isFinite(Number(r.totalPrice))) {
        item.totalPrice = Number(r.totalPrice);
      }
      return item;
    })
    .filter((row): row is MaterialListItem => row !== null);
}

function parseAccessoryTotals(raw: unknown): AccessoryTotal[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row): AccessoryTotal | null => {
      const r = asRecord(row);
      if (!r || typeof r.name !== 'string') return null;
      const qty = Number(r.qty);
      if (!Number.isFinite(qty)) return null;
      const item: AccessoryTotal = { name: r.name, qty };
      if (typeof r.unit === 'string' && r.unit.trim()) {
        item.unit = r.unit.trim();
      }
      const pieceQty = Number(r.pieceQty);
      if (Number.isFinite(pieceQty) && pieceQty > 0) {
        item.pieceQty = pieceQty;
      }
      return item;
    })
    .filter((row): row is AccessoryTotal => row !== null);
}

/** M2/M3 Rollers: `4 sets (16 pcs)` when pieceQty present; else `{qty} {unit}`. */
export function formatAccessoryQuantity(item: Pick<AccessoryTotal, 'qty' | 'unit' | 'pieceQty'>): string {
  const unit = item.unit?.trim() || 'pcs';
  const qty = item.qty;
  if (item.pieceQty != null && item.pieceQty > 0) {
    return `${qty} ${unit} (${item.pieceQty} pcs)`;
  }
  return `${qty} ${unit}`;
}

/** Label for material list quantity badge (API `unit` or singular/plural defaults per integration doc). */
export function materialListDisplayUnit(item: Pick<MaterialListItem, 'type' | 'unit' | 'units'>): string {
  if (item.unit) return item.unit;
  const n = item.units;
  switch (item.type) {
    case 'Profile':
      return n === 1 ? 'length' : 'lengths';
    case 'Sheet':
      return n === 1 ? 'sheet' : 'sheets';
    case 'Roll':
      return n === 1 ? 'roll' : 'rolls';
    case 'Accessory':
    case 'Accessory_Pair':
      return n === 1 ? 'pc' : 'pcs';
    case 'Meter':
      return 'm';
    default:
      return n === 1 ? 'unit' : 'units';
  }
}

/** Names of purchase-line accessories on materialList (e.g. Frame Screw) — hide duplicates from accessoryTotals. */
export function materialListPurchaseAccessoryNames(materialList: MaterialListItem[]): Set<string> {
  const names = new Set<string>();
  for (const row of materialList) {
    if (row.type === 'Accessory' || row.type === 'Accessory_Pair') {
      names.add(row.item.trim().toLowerCase());
    }
  }
  return names;
}

export function filterAccessoryTotalsForDisplay(
  accessoryTotals: AccessoryTotal[],
  materialList: MaterialListItem[]
): AccessoryTotal[] {
  const purchaseNames = materialListPurchaseAccessoryNames(materialList);
  if (purchaseNames.size === 0) return accessoryTotals;
  return accessoryTotals.filter((a) => !purchaseNames.has(a.name.trim().toLowerCase()));
}

/** Normalize API calculation result (calculate or lastCalculationResult). */
export function parseCalculationResult(raw: unknown): CalculationResult {
  const data = asRecord(raw) ?? {};

  const materialList = parseMaterialList(data.materialList);
  const cuttingList = Array.isArray(data.cuttingList) ? data.cuttingList : [];
  const rubberTotals = Array.isArray(data.rubberTotals) ? data.rubberTotals : [];
  const accessoryTotals = parseAccessoryTotals(data.accessoryTotals);
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
