import type { PaymentProvider } from '@/services/api/subscriptions.service';

const STORAGE_KEY = 'paymentCallback';
const LEGACY_REF_KEY = 'paymentReference';
const LEGACY_PROVIDER_KEY = 'paymentProvider';
export const PAYMENT_CALLBACK_TTL_MS = 30 * 60 * 1000;

export interface PaymentCallbackData {
  reference: string;
  provider: PaymentProvider;
  startedAt: number;
}

function migrateLegacyStorage(): PaymentCallbackData | null {
  const legacyRef = localStorage.getItem(LEGACY_REF_KEY);
  if (!legacyRef) return null;

  const provider = (localStorage.getItem(LEGACY_PROVIDER_KEY) || 'paystack') as PaymentProvider;
  const data: PaymentCallbackData = {
    reference: legacyRef,
    provider,
    startedAt: Date.now(),
  };
  localStorage.removeItem(LEGACY_REF_KEY);
  localStorage.removeItem(LEGACY_PROVIDER_KEY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

export function savePaymentCallback(reference: string, provider: PaymentProvider): void {
  const data: PaymentCallbackData = {
    reference,
    provider,
    startedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  localStorage.removeItem(LEGACY_REF_KEY);
  localStorage.removeItem(LEGACY_PROVIDER_KEY);
}

export function readPaymentCallback(): PaymentCallbackData | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as PaymentCallbackData;
      if (parsed.reference && parsed.provider && parsed.startedAt) {
        return parsed;
      }
    } catch {
      clearPaymentCallback();
      return null;
    }
  }
  return migrateLegacyStorage();
}

export function isPaymentCallbackExpired(data: PaymentCallbackData): boolean {
  return Date.now() - data.startedAt > PAYMENT_CALLBACK_TTL_MS;
}

export function clearPaymentCallback(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_REF_KEY);
  localStorage.removeItem(LEGACY_PROVIDER_KEY);
}

export function hasActivePaymentCallback(): boolean {
  const data = readPaymentCallback();
  if (!data) return false;
  if (isPaymentCallbackExpired(data)) {
    clearPaymentCallback();
    return false;
  }
  return true;
}

export function getPaymentReferenceFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return (
    urlParams.get('reference')?.trim() ||
    urlParams.get('tx_ref')?.trim() ||
    urlParams.get('trxref')?.trim() ||
    null
  );
}

export function hasPaymentCallbackUrlParams(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('reference') || urlParams.has('tx_ref') || urlParams.has('trxref');
}
