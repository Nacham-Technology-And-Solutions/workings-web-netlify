export type QuoteTaxType = 'percent' | 'fixed';

export function computeQuoteTaxAmount(
  taxType: QuoteTaxType,
  taxValue: number,
  taxableBase: number
): number {
  if (!taxValue || taxValue <= 0) return 0;
  if (taxType === 'percent') {
    return Math.round((taxableBase * taxValue) / 100);
  }
  return taxValue;
}

export function quoteTaxChargeLabel(taxType: QuoteTaxType, taxValue: number): string {
  if (taxType === 'percent' && taxValue > 0) {
    return `Tax (${taxValue}%)`;
  }
  return 'Tax';
}
