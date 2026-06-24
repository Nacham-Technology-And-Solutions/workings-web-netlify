import type { MaterialListQuoteLine, PricingInput } from '@/types/estimation';

function normalizeMatchKey(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Backend display name aliases → canonical names used on preview lines.
 * Prefer exact API display names; these cover legacy stored rows.
 */
const MATERIAL_DESCRIPTION_ALIASES: Record<string, string[]> = {
  '2-track jamb': ['jamb profile'],
  'lockset/key': ['lock set', 'lockset', 'key/lock'],
  rollers: ['roller'],
};

/** Map material display names and item keys to estimation preview lines. */
export function buildMaterialPreviewLookup(
  lines: MaterialListQuoteLine[],
  pricingInputs: PricingInput[] = []
): Map<string, MaterialListQuoteLine> {
  const lookup = new Map<string, MaterialListQuoteLine>();

  for (const line of lines) {
    lookup.set(normalizeMatchKey(line.itemKey), line);
    lookup.set(normalizeMatchKey(line.description), line);
  }

  for (const input of pricingInputs) {
    const line = lines.find((row) => row.itemKey === input.itemKey);
    if (line) {
      lookup.set(normalizeMatchKey(input.itemName), line);
    }
  }

  return lookup;
}

export function findPreviewLineForMaterial(
  materialName: string,
  lookup: Map<string, MaterialListQuoteLine>
): MaterialListQuoteLine | undefined {
  const key = normalizeMatchKey(materialName);
  const direct = lookup.get(key);
  if (direct) return direct;

  const aliases = MATERIAL_DESCRIPTION_ALIASES[key];
  if (aliases) {
    for (const alias of aliases) {
      const match = lookup.get(normalizeMatchKey(alias));
      if (match) return match;
    }
  }

  return undefined;
}
