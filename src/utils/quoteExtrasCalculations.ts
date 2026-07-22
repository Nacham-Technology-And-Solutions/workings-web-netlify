export type QuoteTaxType = 'percent' | 'fixed';

export function computeQuoteTaxAmount(
  taxType: QuoteTaxType,
  taxValue: number,
  taxableBase: number
): number {
  if (!taxValue || taxValue <= 0) return 0;
  const safeBase = Math.max(0, taxableBase);
  if (taxType === 'percent') {
    const cappedPercent = Math.min(100, Math.max(0, taxValue));
    return Math.round((safeBase * cappedPercent) / 100);
  }
  return Math.min(safeBase, Math.max(0, taxValue));
}

export function quoteTaxChargeLabel(taxType: QuoteTaxType, taxValue: number): string {
  if (taxType === 'percent' && taxValue > 0) {
    return `Tax (${taxValue}%)`;
  }
  return 'Tax';
}
