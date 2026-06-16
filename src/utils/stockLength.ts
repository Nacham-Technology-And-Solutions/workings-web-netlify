/**
 * Stock length unit normalization — matches backend estimation engine rules.
 * Values ≤ 20 are metres; values > 20 are millimetres.
 */
export function normalizeStockLengthMm(value: number): number {
  if (value <= 20) {
    return Math.round(value * 1000);
  }
  return Math.round(value);
}

/** Map project calculationSettings.stockLength (metres, e.g. 6) to quoteSettings mm. */
export function stockLengthMmFromProjectSettings(stockLength?: number): number {
  if (stockLength == null || Number.isNaN(stockLength)) {
    return 6000;
  }
  return normalizeStockLengthMm(stockLength);
}
