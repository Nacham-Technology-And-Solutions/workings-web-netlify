import type { QuoteSettings } from '@/types/estimation';
import { stockLengthMmFromProjectSettings } from '@/utils/stockLength';

const NET_ROLL_HEIGHTS: Record<string, number> = {
  '1220': 1220,
  '1500': 1500,
  '1800': 1800,
};

export function parseNetRollHeightMm(netRoll?: string | number | { widthMm?: number; lengthMm?: number }): number {
  if (typeof netRoll === 'number' && netRoll > 0) {
    return netRoll;
  }
  if (typeof netRoll === 'object' && netRoll?.lengthMm) {
    return netRoll.lengthMm;
  }
  if (typeof netRoll === 'string') {
    const match = netRoll.match(/(\d{3,4})/);
    if (match) {
      return parseInt(match[1], 10);
    }
    const preset = NET_ROLL_HEIGHTS[netRoll.trim()];
    if (preset) return preset;
  }
  return 1500;
}

export function buildDefaultQuoteSettings(calculationSettings?: {
  stockLength?: number;
  bladeKerf?: number;
  netRoll?: string | { widthMm?: number; lengthMm?: number };
  netMargin?: number;
}): QuoteSettings {
  return {
    stockLength: stockLengthMmFromProjectSettings(calculationSettings?.stockLength),
    kerf: calculationSettings?.bladeKerf ?? 5,
    offcutMarkup: 500,
    rounding: 'nearest_100',
    glassSheetWidth: 3310,
    glassSheetHeight: 2140,
    netRollHeightMm: parseNetRollHeightMm(calculationSettings?.netRoll),
    extraCharges: {
      labour: 0,
      profitPercent: 10,
    },
  };
}
