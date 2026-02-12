/**
 * Module Mapping Utility
 * Maps frontend glazing type strings to backend module IDs
 * 
 * NOTE: This file handles the mapping logic. For module availability/visibility,
 * see moduleConfig.ts which controls which modules appear in the UI.
 */

export type GlazingCategory = 'Window' | 'Door' | 'Net' | 'Partition' | 'Curtain Wall';

/**
 * Maps glazing type string and category to module ID
 * @param type - Frontend glazing type string (e.g., "Casement Window (D/Curve)")
 * @param category - Glazing category (e.g., "Window")
 * @returns Module ID (e.g., "M1_Casement_DCurve")
 */
export function mapGlazingTypeToModuleId(type: string, category: GlazingCategory): string {
  const normalizedType = type.toLowerCase().trim();

  // Window modules
  if (category === 'Window') {
    if (normalizedType.includes('casement') && (normalizedType.includes('d/curve') || normalizedType.includes('d-curve'))) {
      return 'M1_Casement_DCurve';
    }
    if (normalizedType.includes('sliding') && normalizedType.includes('standard 2-sash')) {
      return 'M2_Sliding_2Sash';
    }
    if (normalizedType.includes('sliding') && normalizedType.includes('2-sash') && normalizedType.includes('fixed net')) {
      return 'M3_Sliding_2Sash_Net';
    }
    if (normalizedType.includes('sliding') && normalizedType.includes('3-track')) {
      return 'M4_Sliding_3Track';
    }
    if (normalizedType.includes('sliding') && normalizedType.includes('3-sash') && normalizedType.includes('all-glass')) {
      return 'M5_Sliding_3Sash';
    }
  }

  // Net modules
  if (category === 'Net') {
    if (normalizedType.includes('1125/26') && normalizedType.includes('1132')) {
      return 'M6_Net_1125_26';
    }
    if (normalizedType.includes('ebm-net') && normalizedType.includes('1125/26')) {
      return 'M7_EBM_Net_1125_26';
    }
    if (normalizedType.includes('ebm-net') && normalizedType.includes('u-channel')) {
      return 'M8_EBM_Net_UChannel';
    }
  }

  // Curtain Wall modules
  if (category === 'Curtain Wall') {
    if (normalizedType.includes('curtain wall') && normalizedType.includes('advanced grid')) {
      return 'M9_Curtain_Wall_Grid';
    }
  }

  // Door modules (Uncompleted Modules - placeholders)
  if (category === 'Door') {
    // These will be implemented in future phases
    // For now, return placeholder or default
    return 'UM_Door_Placeholder';
  }

  // Partition modules (Uncompleted Modules - placeholders)
  if (category === 'Partition') {
    // These will be implemented in future phases
    return 'UM_Partition_Placeholder';
  }

  // Default fallback - log warning
  console.warn(`Unknown glazing type mapping: ${type} in category ${category}`);
  return 'UNKNOWN_MODULE';
}

/**
 * Gets the glazing category from SelectProjectData key
 */
export function getCategoryFromKey(key: string): GlazingCategory {
  const categoryMap: Record<string, GlazingCategory> = {
    windows: 'Window',
    doors: 'Door',
    skylights: 'Net', // Frontend uses "skylights" for nets
    glassPanels: 'Curtain Wall', // Frontend uses "glassPanels" for curtain walls
  };

  return categoryMap[key] || 'Window';
}

/**
 * Gets the standard glazing type name from frontend type string
 * Returns the type as-is since we now use standardized names
 */
export function normalizeGlazingType(type: string, category: GlazingCategory): string {
  // Types are already standardized, return as-is
  return type.trim();
}

