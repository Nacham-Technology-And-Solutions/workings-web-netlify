import type {
  MaterialPrice,
  PaymentMethod,
  QuoteFormatConfig,
} from '@/types/templates';
import type { TemplateConfig } from '@/services/api/templates.service';

const API_MATERIAL_CATEGORIES = new Set(['Profile', 'Glass', 'Accessory', 'Rubber', 'Other']);

function emptyString(value: string | null | undefined): string {
  return value ?? '';
}

function optionalString(value: string | null | undefined): string | undefined {
  if (value == null || value === '') return undefined;
  return value;
}

function sanitizeQuoteFormat(quoteFormat: QuoteFormatConfig): QuoteFormatConfig {
  return {
    ...quoteFormat,
    header: {
      ...quoteFormat.header,
      logoSource: quoteFormat.header.logoSource ?? 'none',
      logoUrl: quoteFormat.header.logoUrl ?? undefined,
      logoSize: quoteFormat.header.logoSize ?? 'medium',
      logoPosition: quoteFormat.header.logoPosition ?? 'top-right',
      companyName: emptyString(quoteFormat.header.companyName),
      tagline: optionalString(quoteFormat.header.tagline),
      alignment: quoteFormat.header.alignment ?? 'left',
    },
    footer: {
      ...quoteFormat.footer,
      content: emptyString(quoteFormat.footer.content),
      alignment: quoteFormat.footer.alignment ?? 'center',
      visible: quoteFormat.footer.visible ?? true,
    },
  };
}

function sanitizeMaterialPriceForApi(price: MaterialPrice) {
  const category = API_MATERIAL_CATEGORIES.has(price.category)
    ? (price.category as 'Profile' | 'Glass' | 'Accessory' | 'Rubber' | 'Other')
    : 'Other';

  return {
    id: price.id,
    name: emptyString(price.name),
    category,
    unit: emptyString(price.unit),
    unitPrice: Number.isFinite(price.unitPrice) ? price.unitPrice : 0,
    ...(optionalString(price.description) ? { description: price.description!.trim() } : {}),
    ...(Array.isArray(price.priceHistory) && price.priceHistory.length > 0
      ? {
          priceHistory: price.priceHistory.map((entry) => ({
            price: entry.price,
            date: entry.date,
            ...(optionalString(entry.changedBy) ? { changedBy: entry.changedBy } : {}),
          })),
        }
      : {}),
    createdAt: price.createdAt,
    updatedAt: price.updatedAt,
  };
}

function sanitizePaymentMethod(method: PaymentMethod): PaymentMethod {
  return {
    id: method.id,
    accountName: emptyString(method.accountName),
    accountNumber: emptyString(method.accountNumber),
    bankName: emptyString(method.bankName),
    isDefault: Boolean(method.isDefault),
    createdAt: method.createdAt,
    updatedAt: method.updatedAt,
  };
}

/** Coerce null/invalid values before PUT /api/v1/templates (Zod rejects null on optional strings). */
export function sanitizeTemplateConfigForApi(config: TemplateConfig): TemplateConfig {
  const materialPrices = (config.materialPrices ?? []).map(sanitizeMaterialPriceForApi);
  const paymentMethods = (config.paymentMethods ?? []).map(sanitizePaymentMethod);

  return {
    quoteFormat: sanitizeQuoteFormat(config.quoteFormat),
    paymentMethods,
    paymentMethodConfig: {
      methods: paymentMethods,
      displayOptions: {
        showInPreview: config.paymentMethodConfig.displayOptions.showInPreview ?? true,
        showInPDF: config.paymentMethodConfig.displayOptions.showInPDF ?? true,
        customInstructions:
          config.paymentMethodConfig.displayOptions.customInstructions ?? undefined,
      },
    },
    pdfExport: config.pdfExport,
    materialPrices,
    materialPricesConfig: {
      defaultMarkup: config.materialPricesConfig?.defaultMarkup ?? 0,
      categoryMarkups: config.materialPricesConfig?.categoryMarkups ?? {},
      prices: (config.materialPricesConfig?.prices ?? materialPrices).map(sanitizeMaterialPriceForApi),
    },
  };
}
