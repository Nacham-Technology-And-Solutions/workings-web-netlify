/**
 * Module Configuration System
 * 
 * Central source of truth for which glazing modules are enabled/disabled.
 * This determines what categories and types appear in the Project Wizard UI.
 * 
 * To enable a module:
 * 1. Ensure the backend module is implemented
 * 2. Add proper mapping in moduleMapping.ts
 * 3. Set enabled: true for the module here
 */

import type { GlazingCategory } from './moduleMapping';

/**
 * Module configuration structure
 */
export interface ModuleTypeConfig {
  /** Whether this type is enabled and functional */
  enabled: boolean;
  /** Backend module ID (null if placeholder/not implemented) */
  moduleId: string | null;
  /** Display label for the type */
  label: string;
  /** Value identifier for the type */
  value: string;
}

/**
 * Category configuration
 */
export interface ModuleCategoryConfig {
  /** Whether this category is enabled */
  enabled: boolean;
  /** Category name */
  name: string;
  /** Types available in this category */
  types: ModuleTypeConfig[];
}

/**
 * Module Configuration Map
 * 
 * Only enabled modules will appear in the UI.
 * Disabled modules are completely hidden from users.
 */
export const MODULE_CONFIG: Record<GlazingCategory, ModuleCategoryConfig> = {
  // Window Category - Fully implemented
  Window: {
    enabled: true,
    name: 'Window',
    types: [
      {
        enabled: true,
        moduleId: 'M1_Casement_DCurve',
        label: 'Casement Window (D/Curve)',
        value: 'Casement Window (D/Curve)',
      },
      {
        enabled: true,
        moduleId: 'M2_Sliding_2Sash',
        label: 'Sliding Window (Standard 2-Sash)',
        value: 'Sliding Window (Standard 2-Sash)',
      },
      {
        enabled: true,
        moduleId: 'M3_Sliding_2Sash_Net',
        label: 'Sliding Window (2-Sash + Fixed Net)',
        value: 'Sliding Window (2-Sash + Fixed Net)',
      },
      {
        enabled: true,
        moduleId: 'M4_Sliding_3Track',
        label: 'Sliding Window (3-Track, 2 Glass + 1 Net)',
        value: 'Sliding Window (3-Track, 2 Glass + 1 Net)',
      },
      {
        enabled: true,
        moduleId: 'M5_Sliding_3Sash',
        label: 'Sliding Window (3-Sash, All-Glass)',
        value: 'Sliding Window (3-Sash, All-Glass)',
      },
    ],
  },

  // Door Category - Not implemented (returns placeholder)
  Door: {
    enabled: false, // Disabled - all types return UM_Door_Placeholder
    name: 'Door',
    types: [
      {
        enabled: false,
        moduleId: null,
        label: 'Sliding Door',
        value: 'sliding-door',
      },
      {
        enabled: false,
        moduleId: null,
        label: 'French Door',
        value: 'french-door',
      },
      {
        enabled: false,
        moduleId: null,
        label: 'Patio Door',
        value: 'patio-door',
      },
      {
        enabled: false,
        moduleId: null,
        label: 'Security Door',
        value: 'security-door',
      },
      {
        enabled: false,
        moduleId: null,
        label: 'Entrance Door',
        value: 'entrance-door',
      },
    ],
  },

  // Net Category - Fully implemented
  Net: {
    enabled: true,
    name: 'Net',
    types: [
      {
        enabled: true,
        moduleId: 'M6_Net_1125_26',
        label: '1125/26 Net (1132-panel)',
        value: '1125/26 Net (1132-panel)',
      },
      {
        enabled: true,
        moduleId: 'M7_EBM_Net_1125_26',
        label: 'EBM-net (1125/26 Frame)',
        value: 'EBM-net (1125/26 Frame)',
      },
      {
        enabled: true,
        moduleId: 'M8_EBM_Net_UChannel',
        label: 'EBM-Net (U-Channel)',
        value: 'EBM-Net (U-Channel)',
      },
    ],
  },

  // Curtain Wall Category - Fully implemented
  'Curtain Wall': {
    enabled: true,
    name: 'Curtain Wall',
    types: [
      {
        enabled: true,
        moduleId: 'M9_Curtain_Wall_Grid',
        label: 'Curtain Wall Window (Advanced Grid)',
        value: 'Curtain Wall Window (Advanced Grid)',
      },
    ],
  },

  // Partition Category - Not implemented (returns placeholder)
  Partition: {
    enabled: false, // Disabled - all types return UM_Partition_Placeholder
    name: 'Partition',
    types: [
      {
        enabled: false,
        moduleId: null,
        label: 'Glass Partition',
        value: 'glass-partition',
      },
      {
        enabled: false,
        moduleId: null,
        label: 'Office Partition',
        value: 'office-partition',
      },
    ],
  },
};

/**
 * Get enabled categories only
 */
export function getEnabledCategories(): GlazingCategory[] {
  return Object.keys(MODULE_CONFIG).filter(
    (category) => MODULE_CONFIG[category as GlazingCategory].enabled
  ) as GlazingCategory[];
}

/**
 * Get enabled types for a category
 */
export function getEnabledTypesForCategory(category: GlazingCategory): ModuleTypeConfig[] {
  const categoryConfig = MODULE_CONFIG[category];
  if (!categoryConfig || !categoryConfig.enabled) {
    return [];
  }
  return categoryConfig.types.filter((type) => type.enabled);
}

/**
 * Check if a category is enabled
 */
export function isCategoryEnabled(category: GlazingCategory): boolean {
  return MODULE_CONFIG[category]?.enabled ?? false;
}

/**
 * Check if a type is enabled
 */
export function isTypeEnabled(category: GlazingCategory, typeValue: string): boolean {
  const categoryConfig = MODULE_CONFIG[category];
  if (!categoryConfig || !categoryConfig.enabled) {
    return false;
  }
  const type = categoryConfig.types.find((t) => t.value === typeValue);
  return type?.enabled ?? false;
}

/**
 * Get module ID for a type (returns null if disabled or not implemented)
 */
export function getModuleIdForType(category: GlazingCategory, typeValue: string): string | null {
  const categoryConfig = MODULE_CONFIG[category];
  if (!categoryConfig || !categoryConfig.enabled) {
    return null;
  }
  const type = categoryConfig.types.find((t) => t.value === typeValue);
  return type?.moduleId ?? null;
}

