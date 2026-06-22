import type { MaterialListQuoteLine, PricingInput } from '@/types/estimation';

function normalizeMatchKey(value: string): string {
  return value.trim().toLowerCase();
}

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
  return lookup.get(normalizeMatchKey(materialName));
}
