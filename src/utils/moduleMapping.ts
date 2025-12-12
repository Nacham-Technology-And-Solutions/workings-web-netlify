/**
 * Module Mapping Utility
 * Maps frontend glazing type strings to backend module IDs
 */

export type GlazingCategory = 'Window' | 'Door' | 'Net' | 'Partition' | 'Curtain Wall';

/**
 * Maps glazing type string and category to module ID
 * @param type - Frontend glazing type string (e.g., "Casement (D/curve)")
 * @param category - Glazing category (e.g., "Window")
 * @returns Module ID (e.g., "M1_Casement_DCurve")
 */
export function mapGlazingTypeToModuleId(type: string, category: GlazingCategory): string {
  const normalizedType = type.toLowerCase().trim();

  // Window modules
  if (category === 'Window') {
    if (normalizedType.includes('casement') && normalizedType.includes('d/curve')) {
      return 'M1_Casement_DCurve';
    }
    if (normalizedType.includes('casement') && normalizedType.includes('ebm')) {
      return 'M1_Casement_DCurve'; // EBM Casement uses same module (or separate if different)
    }
    if (normalizedType.includes('sliding') && normalizedType.includes('normal')) {
      return 'M2_Sliding_2Sash';
    }
    if (normalizedType.includes('sliding') && normalizedType.includes('ebm')) {
      return 'M2_Sliding_2Sash'; // EBM Sliding uses same module (or separate if different)
    }
    if (normalizedType.includes('sliding') && normalizedType.includes('ghana')) {
      return 'M2_Sliding_2Sash'; // Ghana Sliding uses same module (or separate if different)
    }
    // Add more window type mappings as needed
  }

  // Net modules
  if (category === 'Net') {
    if (normalizedType.includes('1125/26') || normalizedType.includes('1132')) {
      return 'M6_Net_1125_26';
    }
    if (normalizedType.includes('ebm') && normalizedType.includes('1125/26')) {
      return 'M7_EBM_Net_1125_26';
    }
    if (normalizedType.includes('ebm') && normalizedType.includes('u-channel')) {
      return 'M8_EBM_Net_UChannel';
    }
    if (normalizedType.includes('fixed')) {
      return 'M6_Net_1125_26'; // Default to 1125/26 for fixed nets
    }
  }

  // Curtain Wall modules
  if (category === 'Curtain Wall') {
    if (normalizedType.includes('grid') || normalizedType.includes('advanced')) {
      return 'M9_Curtain_Wall_Grid';
    }
    // Add more curtain wall type mappings as needed
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
 * Converts "Casement (D/curve)" to "Casement Window (D/Curve)"
 */
export function normalizeGlazingType(type: string, category: GlazingCategory): string {
  const normalized = type.trim();

  // Add category suffix if not present
  if (category === 'Window' && !normalized.toLowerCase().includes('window')) {
    return `${normalized} Window`;
  }
  if (category === 'Door' && !normalized.toLowerCase().includes('door')) {
    return `${normalized} Door`;
  }
  if (category === 'Net' && !normalized.toLowerCase().includes('net')) {
    return `${normalized} Net`;
  }
  if (category === 'Curtain Wall' && !normalized.toLowerCase().includes('curtain')) {
    return `${normalized} Curtain Wall`;
  }

  return normalized;
}

