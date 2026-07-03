import type { PricingInput, QuoteSettings } from '@/types/estimation';

export function computePreviewInputsHash(
  quoteSource: 'project_cart' | 'material_list',
  pricingInputs: PricingInput[],
  quoteSettings: QuoteSettings
): string {
  return JSON.stringify({ quoteSource, pricingInputs, quoteSettings });
}
