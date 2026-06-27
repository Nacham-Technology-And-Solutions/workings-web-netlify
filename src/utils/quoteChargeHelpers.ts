/**
 * Helpers to separate product line items from extra charges (labour, transport, etc.)
 * when reading/writing quotes via the backend items[] API.
 */

export interface BackendQuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const EXTRA_CHARGE_LABELS = new Set([
  'labor charge',
  'labour',
  'transport charge',
  'transport',
  'transportation fee',
  'freight charges',
  'installation',
  'miscellaneous',
  'other',
]);

export function isQuoteDiscountDescription(description: string): boolean {
  return description.trim().toLowerCase().startsWith('discount');
}

export function isQuoteExtraChargeDescription(description: string): boolean {
  const normalized = description.trim().toLowerCase();
  if (isQuoteDiscountDescription(normalized)) return true;
  return EXTRA_CHARGE_LABELS.has(normalized);
}

export function splitQuoteBackendItems<T extends BackendQuoteLineItem>(items: T[]): {
  productItems: T[];
  extraChargeItems: T[];
} {
  const productItems: T[] = [];
  const extraChargeItems: T[] = [];
  for (const item of items) {
    if (isQuoteExtraChargeDescription(item.description)) {
      extraChargeItems.push(item);
    } else {
      productItems.push(item);
    }
  }
  return { productItems, extraChargeItems };
}

/** True if a charge with a similar label or amount is already listed. */
export function chargeAlreadyListed(
  charges: Array<{ label: string; amount: number }>,
  label: string,
  amount: number
): boolean {
  const normalizedLabel = label.trim().toLowerCase();
  return charges.some((c) => {
    const existing = c.label.trim().toLowerCase();
    if (existing === normalizedLabel) return true;
    // Estimation uses "Labour" vs dropdown "Labor Charge", etc.
    const labourMatch =
      (existing.includes('labor') || existing.includes('labour')) &&
      (normalizedLabel.includes('labor') || normalizedLabel.includes('labour'));
    const transportMatch =
      (existing.includes('transport') || existing.includes('freight')) &&
      (normalizedLabel.includes('transport') || normalizedLabel.includes('freight'));
    if (labourMatch || transportMatch) return Math.abs(c.amount - amount) < 1;
    return Math.abs(c.amount - amount) < 1 && existing === normalizedLabel;
  });
}

export function extraChargeItemsToAddedCharges(
  extraChargeItems: BackendQuoteLineItem[]
): Array<{ description: string; amount: number }> {
  return extraChargeItems
    .filter((item) => !isQuoteDiscountDescription(item.description) && item.totalPrice > 0)
    .map((item) => ({ description: item.description, amount: item.totalPrice }));
}

export function parseDiscountPercentFromDescription(description: string): number | undefined {
  const match = description.match(/discount\s*\((\d+(?:\.\d+)?)\s*%?\)/i);
  if (match) return parseFloat(match[1]);
  return undefined;
}
