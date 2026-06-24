/**
 * Unified Sliding_Window module (M2–M5 family).
 * @see docs/merger/CALCULATION-MODULES-PARAMETERS copy.md
 *
 * UI form state uses `SlidingSash` (*_Sash) labels; API cart/PATCH uses `panel` (*_Panel).
 */

import type { GlazingDimension } from '@/types/project';

export const SLIDING_WINDOW_MODULE_ID = 'Sliding_Window';
export const SLIDING_WINDOW_GLAZING_TYPE = 'Sliding Window';

/** Form / illustration layout (UI — “sash layout” dropdown). */
export type SlidingSash = 'Two_Glass_Sash' | 'Three_Glass_Sash' | 'Two_Glass_And_One_Net_Sash';

/** API `panel` enum (preferred on cart and stored parameters). */
export type SlidingPanel =
  | 'Two_Glass_Panel'
  | 'Three_Glass_Panel'
  | 'Two_Glass_And_One_Net_Panel';

export type SlidingPanelKind = 'glass' | 'net';

export interface SlidingConfig {
  sash: SlidingSash;
  fixedNet: boolean;
}

const SASH_TO_PANEL: Record<SlidingSash, SlidingPanel> = {
  Two_Glass_Sash: 'Two_Glass_Panel',
  Three_Glass_Sash: 'Three_Glass_Panel',
  Two_Glass_And_One_Net_Sash: 'Two_Glass_And_One_Net_Panel',
};

const PANEL_TO_SASH: Record<SlidingPanel, SlidingSash> = {
  Two_Glass_Panel: 'Two_Glass_Sash',
  Three_Glass_Panel: 'Three_Glass_Sash',
  Two_Glass_And_One_Net_Panel: 'Two_Glass_And_One_Net_Sash',
};

/** User-facing sash layout options in the measurement form. */
export const SLIDING_SASH_OPTIONS: Array<{
  value: SlidingSash;
  label: string;
}> = [
  { value: 'Two_Glass_Sash', label: '2-track, 2 glass sashes' },
  { value: 'Two_Glass_And_One_Net_Sash', label: '3-track, 2 glass + 1 net sash' },
  { value: 'Three_Glass_Sash', label: '3-track, 3 glass sashes' },
];

const LEGACY_SLIDING_MODULE_IDS = new Set([
  'M2_Sliding_2Sash',
  'M3_Sliding_2Sash_Net',
  'M4_Sliding_3Track',
  'M5_Sliding_3Sash',
]);

const LEGACY_TYPE_PATTERNS: Array<{ test: (t: string) => boolean; config: SlidingConfig }> = [
  {
    test: (t) => t.includes('standard 2-sash'),
    config: { sash: 'Two_Glass_Sash', fixedNet: false },
  },
  {
    test: (t) => t.includes('2-sash') && t.includes('fixed net'),
    config: { sash: 'Two_Glass_Sash', fixedNet: true },
  },
  {
    test: (t) => t.includes('3-track'),
    config: { sash: 'Two_Glass_And_One_Net_Sash', fixedNet: false },
  },
  {
    test: (t) => t.includes('3-sash') && t.includes('all-glass'),
    config: { sash: 'Three_Glass_Sash', fixedNet: false },
  },
];

const LEGACY_MODULE_CONFIG: Record<string, SlidingConfig> = {
  M2_Sliding_2Sash: { sash: 'Two_Glass_Sash', fixedNet: false },
  M3_Sliding_2Sash_Net: { sash: 'Two_Glass_Sash', fixedNet: true },
  M4_Sliding_3Track: { sash: 'Two_Glass_And_One_Net_Sash', fixedNet: false },
  M5_Sliding_3Sash: { sash: 'Three_Glass_Sash', fixedNet: false },
};

export function isSlidingModuleId(moduleId: string): boolean {
  return moduleId === SLIDING_WINDOW_MODULE_ID || LEGACY_SLIDING_MODULE_IDS.has(moduleId);
}

export function isSlidingGlazingType(type: string): boolean {
  const normalized = type.trim().toLowerCase();
  if (normalized === SLIDING_WINDOW_GLAZING_TYPE.toLowerCase()) return true;
  return LEGACY_TYPE_PATTERNS.some(({ test }) => test(normalized));
}

export function isValidSash(value: string): value is SlidingSash {
  return (
    value === 'Two_Glass_Sash' ||
    value === 'Three_Glass_Sash' ||
    value === 'Two_Glass_And_One_Net_Sash'
  );
}

export function isValidPanel(value: string): value is SlidingPanel {
  return (
    value === 'Two_Glass_Panel' ||
    value === 'Three_Glass_Panel' ||
    value === 'Two_Glass_And_One_Net_Panel'
  );
}

/** Map form layout → API `panel` field. */
export function toApiPanel(sash: SlidingSash): SlidingPanel {
  return SASH_TO_PANEL[sash];
}

/** Parse API `panel` or deprecated `sash` → form layout. */
export function parseApiPanelOrSash(value?: string): SlidingSash | null {
  if (!value) return null;
  if (isValidSash(value)) return value;
  if (isValidPanel(value)) return PANEL_TO_SASH[value];
  return null;
}

/** Cart / PATCH fields for Sliding_Window (prefer `panel`, not `sash`). */
export function slidingConfigToApiFields(config: SlidingConfig): {
  panel: SlidingPanel;
  fixedNet: boolean;
} {
  return {
    panel: toApiPanel(config.sash),
    fixedNet: config.fixedNet,
  };
}

/** Human label for a stored API `panel` / legacy `sash` value. */
export function getSlidingPanelDisplayLabel(
  parameters?: GlazingDimension['parameters']
): string | null {
  const layout =
    parseApiPanelOrSash(parameters?.panel) ?? parseApiPanelOrSash(parameters?.sash);
  if (!layout) return parameters?.panel ?? parameters?.sash ?? null;
  return SLIDING_SASH_OPTIONS.find((opt) => opt.value === layout)?.label ?? layout;
}

export function resolveSlidingConfigFromLegacy(
  glazingType?: string,
  moduleId?: string,
  parameters?: GlazingDimension['parameters']
): SlidingConfig | null {
  const layout =
    parseApiPanelOrSash(parameters?.panel) ?? parseApiPanelOrSash(parameters?.sash);

  if (layout) {
    return {
      sash: layout,
      fixedNet: Boolean(parameters?.fixedNet ?? parameters?.options?.fixedNet),
    };
  }

  if (moduleId && LEGACY_MODULE_CONFIG[moduleId]) {
    return { ...LEGACY_MODULE_CONFIG[moduleId] };
  }

  const normalized = (glazingType ?? '').trim().toLowerCase();
  for (const { test, config } of LEGACY_TYPE_PATTERNS) {
    if (test(normalized)) return { ...config };
  }

  if (moduleId === SLIDING_WINDOW_MODULE_ID) {
    return { sash: 'Two_Glass_Sash', fixedNet: false };
  }

  return null;
}

/** Sash columns for the sliding window illustration (fixed net is a separate full-area layer). */
export function getSlidingIllustrationPanels(config: SlidingConfig): SlidingPanelKind[] {
  const { sash } = config;

  if (sash === 'Three_Glass_Sash') {
    return ['glass', 'glass', 'glass'];
  }
  if (sash === 'Two_Glass_And_One_Net_Sash') {
    return ['glass', 'net', 'glass'];
  }
  return ['glass', 'glass'];
}

export function getSlidingIllustrationLabel(config: SlidingConfig): string {
  const panels = getSlidingIllustrationPanels(config);
  const parts: string[] = [];
  const glassCount = panels.filter((p) => p === 'glass').length;
  const netSashCount = panels.filter((p) => p === 'net').length;

  if (glassCount > 0) parts.push(`${glassCount} glass`);
  if (netSashCount > 0) parts.push(`${netSashCount} net sash`);
  if (config.fixedNet) parts.push('fixed net (full opening)');

  return parts.length > 0 ? parts.join(' + ') : 'Sliding window';
}

const LEGACY_SLIDING_TYPE_VALUES = new Set([
  'Sliding Window (Standard 2-Sash)',
  'Sliding Window (2-Sash + Fixed Net)',
  'Sliding Window (3-Track, 2 Glass + 1 Net)',
  'Sliding Window (3-Sash, All-Glass)',
]);

/** Migrate select-project window selections to the unified sliding type. */
export function migrateSelectProjectWindows(windows: string[]): string[] {
  const hasLegacySliding = windows.some(
    (w) => LEGACY_SLIDING_TYPE_VALUES.has(w) || w === SLIDING_WINDOW_GLAZING_TYPE
  );
  if (!hasLegacySliding) return windows;

  const withoutLegacy = windows.filter((w) => !LEGACY_SLIDING_TYPE_VALUES.has(w));
  if (!withoutLegacy.includes(SLIDING_WINDOW_GLAZING_TYPE)) {
    withoutLegacy.push(SLIDING_WINDOW_GLAZING_TYPE);
  }
  return withoutLegacy;
}

/** Normalize a dimension / glazing row to unified sliding type + sash fields (form state). */
export function normalizeSlidingDimensionFields(input: {
  type: string;
  moduleId?: string;
  sash?: string;
  fixedNet?: boolean;
  parameters?: GlazingDimension['parameters'];
}): { type: string; sash?: SlidingSash; fixedNet?: boolean } {
  if (!isSlidingGlazingType(input.type) && !isSlidingModuleId(input.moduleId ?? '')) {
    return { type: input.type };
  }

  const fromForm = input.sash ? parseApiPanelOrSash(input.sash) : null;
  const config = fromForm
    ? { sash: fromForm, fixedNet: Boolean(input.fixedNet) }
    : resolveSlidingConfigFromLegacy(input.type, input.moduleId, input.parameters);

  if (!config) {
    return { type: SLIDING_WINDOW_GLAZING_TYPE, sash: 'Two_Glass_Sash', fixedNet: false };
  }

  return {
    type: SLIDING_WINDOW_GLAZING_TYPE,
    sash: config.sash,
    fixedNet: config.fixedNet,
  };
}
