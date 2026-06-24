import type { MaterialPrice } from '@/types/templates';
import type { MaterialCatalogItem, MaterialCatalogCategory } from '@/types/estimation';

/** Units aligned with estimation engine pricing inputs */
export const ESTIMATION_MATERIAL_UNITS = [
  { value: 'length', label: 'length (profile stock)' },
  { value: 'sheets', label: 'sheets (glass)' },
  { value: 'm', label: 'm (metres)' },
  { value: 'pcs', label: 'pcs (pieces)' },
  { value: 'rolls', label: 'rolls (net mesh)' },
  { value: 'meter', label: 'meter (legacy)' },
  { value: 'piece', label: 'piece (legacy)' },
] as const;

export const ITEM_KEY_PATTERN = /^[a-z0-9]+(\.[a-z0-9_]+)*$/i;

export function isValidItemKey(itemKey: string): boolean {
  const trimmed = itemKey.trim();
  return trimmed.length > 0 && ITEM_KEY_PATTERN.test(trimmed);
}

export function normalizeItemKey(itemKey: string): string {
  return itemKey.trim().toLowerCase();
}

export function hasEstimationItemKey(price: MaterialPrice): boolean {
  return Boolean(price.itemKey?.trim());
}

export function findDuplicateItemKey(
  prices: MaterialPrice[],
  itemKey: string,
  excludeId?: string
): MaterialPrice | undefined {
  const normalized = normalizeItemKey(itemKey);
  return prices.find(
    (p) => p.id !== excludeId && p.itemKey && normalizeItemKey(p.itemKey) === normalized
  );
}

export const ITEM_KEY_EXAMPLES = [
  'profile.track',
  'profile.jamb.2track',
  'profile.track.3',
  'profile.jamb.1track',
  'profile.lock_stile',
  'glass.sheet.3310x2140',
  'accessory.rollers',
  'accessory.lockset',
  'rubber.glazing',
  'net.mesh.1500',
];

export const MATERIAL_PRICE_CATEGORIES: MaterialPrice['category'][] = [
  'Profile',
  'Glass',
  'Accessory',
  'Rubber',
  'Net',
  'Other',
];

export const CATALOG_CATEGORY_ORDER: MaterialCatalogCategory[] = [
  'Profile',
  'Glass',
  'Accessory',
  'Rubber',
  'Net',
  'Other',
];

export function toMaterialPriceCategory(category: string): MaterialPrice['category'] {
  if (MATERIAL_PRICE_CATEGORIES.includes(category as MaterialPrice['category'])) {
    return category as MaterialPrice['category'];
  }
  return 'Other';
}

export function buildCatalogLookup(
  items: MaterialCatalogItem[]
): Map<string, MaterialCatalogItem> {
  const map = new Map<string, MaterialCatalogItem>();
  for (const item of items) {
    map.set(normalizeItemKey(item.itemKey), item);
  }
  return map;
}

export function groupCatalogItems(
  items: MaterialCatalogItem[]
): Array<{ category: MaterialCatalogCategory; items: MaterialCatalogItem[] }> {
  const groups = new Map<MaterialCatalogCategory, MaterialCatalogItem[]>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  return CATALOG_CATEGORY_ORDER.filter((category) => groups.has(category)).map((category) => ({
    category,
    items: groups.get(category)!,
  }));
}

type RawMaterialPrice = MaterialPrice & { item_key?: string | null };

/** Normalize API material price rows (handles snake_case item_key). */
export function normalizeMaterialPrice(price: RawMaterialPrice): MaterialPrice {
  const rawKey = price.itemKey ?? price.item_key ?? undefined;
  return {
    ...price,
    itemKey: rawKey ? normalizeItemKey(String(rawKey)) : undefined,
  };
}

/** Keep itemKey and other estimation fields when the API omits them in responses. */
export function mergeMaterialPriceResponse(
  apiPrice: MaterialPrice | null,
  sentFields?: Partial<MaterialPrice>
): MaterialPrice | null {
  if (!apiPrice) return null;

  const normalized = normalizeMaterialPrice(apiPrice);
  const itemKey = normalized.itemKey ?? sentFields?.itemKey;

  return {
    ...normalized,
    itemKey: itemKey ? normalizeItemKey(itemKey) : undefined,
    source: normalized.source ?? sentFields?.source,
    name: normalized.name || sentFields?.name || '',
    category: normalized.category || sentFields?.category || 'Other',
    unit: normalized.unit || sentFields?.unit || 'length',
  };
}

/** Infer itemKey from catalog display name when legacy API rows lack it. */
export function enrichMaterialPriceFromCatalog(
  price: MaterialPrice,
  catalogItems: MaterialCatalogItem[]
): MaterialPrice {
  const normalized = normalizeMaterialPrice(price);
  if (normalized.itemKey?.trim()) return normalized;

  const byName = catalogItems.find(
    (item) => item.itemName.trim().toLowerCase() === normalized.name.trim().toLowerCase()
  );
  if (!byName) return normalized;

  return {
    ...normalized,
    itemKey: normalizeItemKey(byName.itemKey),
    name: byName.itemName,
    category: toMaterialPriceCategory(byName.category),
    unit: byName.unit,
  };
}

export function enrichMaterialPricesFromCatalog(
  prices: MaterialPrice[],
  catalogItems: MaterialCatalogItem[]
): MaterialPrice[] {
  return prices.map((price) => enrichMaterialPriceFromCatalog(price, catalogItems));
}

export function buildLibraryPriceLookup(
  prices: MaterialPrice[]
): Map<string, MaterialPrice> {
  const sorted = [...prices].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const byKey = new Map<string, MaterialPrice>();

  for (const price of sorted) {
    if (price.itemKey?.trim()) {
      byKey.set(normalizeItemKey(price.itemKey), price);
    }
  }

  return byKey;
}

export function buildLibraryNameLookup(prices: MaterialPrice[]): Map<string, MaterialPrice> {
  const sorted = [...prices].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const byName = new Map<string, MaterialPrice>();
  for (const price of sorted) {
    byName.set(price.name.trim().toLowerCase(), price);
  }
  return byName;
}

/** Overlay Material Prices library onto price-fill rows when user selects My prices. */
export function applyUserLibraryToPricingInputs(
  inputs: PricingInput[],
  library: MaterialPrice[]
): { inputs: PricingInput[]; matchedCount: number } {
  const byKey = buildLibraryPriceLookup(library);
  const byName = buildLibraryNameLookup(library);
  let matchedCount = 0;

  const merged = inputs.map((row) => {
    const libraryRow =
      byKey.get(normalizeItemKey(row.itemKey)) ??
      byName.get(row.itemName.trim().toLowerCase());

    if (!libraryRow || libraryRow.unitPrice <= 0) {
      return row;
    }

    matchedCount += 1;
    return {
      ...row,
      unitPrice: libraryRow.unitPrice,
      source: 'user_library' as const,
    };
  });

  return { inputs: merged, matchedCount };
}
