import type { CartQuoteItemOverride } from '@/types/estimation';
import type { QuoteItemRow } from '@/types/quote';

type PreviewResult =
  | {
      quoteSource: 'project_cart';
      cartLines: Array<{
        description: string;
        quantity: number;
        finalUnitPrice: number;
        width?: number;
        height?: number;
      }>;
    }
  | {
      quoteSource: 'material_list';
      lines: Array<{
        itemKey: string;
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }>;
    };

export function previewToQuoteItems(
  previewResult: PreviewResult,
  itemOverrides: CartQuoteItemOverride[] = []
): QuoteItemRow[] {
  if (previewResult.quoteSource === 'project_cart' && 'cartLines' in previewResult) {
    return previewResult.cartLines.map((line, index) => {
      const override = itemOverrides.find((o) => o.lineIndex === index);
      const unitPrice = override?.finalUnitPrice ?? line.finalUnitPrice;
      return {
        id: `cart-${index + 1}`,
        description: line.description,
        quantity: line.quantity,
        unitPrice,
        total: unitPrice * line.quantity,
      };
    });
  }

  if (previewResult.quoteSource === 'material_list' && 'lines' in previewResult) {
    return previewResult.lines.map((line, index) => ({
      id: line.itemKey || `mat-${index + 1}`,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.totalPrice,
    }));
  }

  return [];
}

export function applyMarginToItems(items: QuoteItemRow[], marginPercent: number): QuoteItemRow[] {
  if (!marginPercent || marginPercent <= 0) {
    return items.map((item) => ({
      ...item,
      total: item.unitPrice * item.quantity,
    }));
  }
  const factor = 1 + marginPercent / 100;
  return items.map((item) => {
    const unitPrice = Math.round(item.unitPrice * factor);
    return {
      ...item,
      unitPrice,
      total: unitPrice * item.quantity,
    };
  });
}

export function quoteItemsSubtotal(items: QuoteItemRow[]): number {
  return items.reduce((sum, item) => sum + item.total, 0);
}

export const ESTIMATION_PRICE_FILL_STORAGE_KEY = 'estimation-price-fill-source';
