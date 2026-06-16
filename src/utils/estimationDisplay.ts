import type { PricingInputSource } from '@/types/estimation';

const SOURCE_LABELS: Record<PricingInputSource, string> = {
  system: 'System',
  user_library: 'My prices',
  last_used: 'Last used',
  manual: 'Manual',
  empty: 'Empty',
};

const SOURCE_STYLES: Record<PricingInputSource, string> = {
  system: 'bg-blue-100 text-blue-800',
  user_library: 'bg-green-100 text-green-800',
  last_used: 'bg-purple-100 text-purple-800',
  manual: 'bg-amber-100 text-amber-800',
  empty: 'bg-gray-100 text-gray-600',
};

export function pricingSourceLabel(source?: PricingInputSource): string {
  if (!source) return 'Empty';
  return SOURCE_LABELS[source] ?? source;
}

export function pricingSourceBadgeClass(source?: PricingInputSource): string {
  const key = source ?? 'empty';
  return SOURCE_STYLES[key] ?? SOURCE_STYLES.empty;
}

export function formatEstimationUnit(unit: string): string {
  switch (unit) {
    case 'length':
      return 'per length';
    case 'sheets':
      return 'per sheet';
    case 'm':
      return 'per metre';
    default:
      return unit;
  }
}
