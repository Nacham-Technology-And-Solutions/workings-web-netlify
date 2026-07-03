export type SettingsSection = 'profile' | 'billings' | 'subscriptionPlans' | 'exportSettings';

const STORAGE_KEY = 'settingsActiveSection';

export const SETTINGS_SECTION_VIEWS: SettingsSection[] = [
  'profile',
  'billings',
  'subscriptionPlans',
  'exportSettings',
];

export function isSettingsSectionView(view: string): view is SettingsSection {
  return SETTINGS_SECTION_VIEWS.includes(view as SettingsSection);
}

export function getStoredSettingsSection(): SettingsSection | null {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored && isSettingsSectionView(stored)) {
    return stored;
  }
  return null;
}

export function setStoredSettingsSection(section: SettingsSection): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, section);
}

export const EXPORT_SETTINGS_NOTICE_KEY = 'exportSettingsNotice';

export type ExportSettingsNotice = {
  type: 'success' | 'error';
  text: string;
};

export function setExportSettingsNotice(notice: ExportSettingsNotice): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(EXPORT_SETTINGS_NOTICE_KEY, JSON.stringify(notice));
}

export function consumeExportSettingsNotice(): ExportSettingsNotice | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(EXPORT_SETTINGS_NOTICE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(EXPORT_SETTINGS_NOTICE_KEY);
  try {
    return JSON.parse(raw) as ExportSettingsNotice;
  } catch {
    return null;
  }
}
