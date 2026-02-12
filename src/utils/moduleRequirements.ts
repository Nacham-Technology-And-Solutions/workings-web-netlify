/**
 * Module Requirements Utility
 * Determines which form fields are required based on module ID
 */

import { mapGlazingTypeToModuleId } from './moduleMapping';
import type { GlazingCategory } from './moduleMapping';

export interface ModuleFieldRequirements {
  requiresWidth: boolean;
  requiresHeight: boolean;
  requiresPanel: boolean;
  requiresOpeningPanels: boolean;
  requiresVerticalPanels: boolean;
  requiresHorizontalPanels: boolean;
  requiresInsideToInside: boolean; // For net modules (M6, M7, M8)
  widthLabel: string;
  heightLabel: string;
  panelLabel: string;
}

/**
 * Gets the module ID from a type value and category
 */
function getModuleId(type: string, category: GlazingCategory): string {
  return mapGlazingTypeToModuleId(type, category);
}

/**
 * Determines field requirements based on module ID
 */
export function getModuleFieldRequirements(
  type: string,
  category: GlazingCategory
): ModuleFieldRequirements {
  // Default requirements
  const defaultRequirements: ModuleFieldRequirements = {
    requiresWidth: true,
    requiresHeight: true,
    requiresPanel: false,
    requiresOpeningPanels: false,
    requiresVerticalPanels: false,
    requiresHorizontalPanels: false,
    requiresInsideToInside: false,
    widthLabel: 'Width',
    heightLabel: 'Height',
    panelLabel: 'Panel',
  };

  const moduleId = getModuleId(type, category);
  
  // Handle unknown or placeholder modules
  if (moduleId === 'UNKNOWN_MODULE' || moduleId.startsWith('UM_')) {
    return defaultRequirements;
  }

  // M1: Casement Window (D/Curve) - requires N and O
  if (moduleId === 'M1_Casement_DCurve') {
    return {
      ...defaultRequirements,
      requiresPanel: true,
      requiresOpeningPanels: true,
      panelLabel: 'Panels (N)',
    };
  }

  // M2-M5: Sliding Windows - only W, H, qty
  if (
    moduleId === 'M2_Sliding_2Sash' ||
    moduleId === 'M3_Sliding_2Sash_Net' ||
    moduleId === 'M4_Sliding_3Track' ||
    moduleId === 'M5_Sliding_3Sash'
  ) {
    return {
      ...defaultRequirements,
      requiresPanel: false,
    };
  }

  // M6-M8: Net modules - require inside-to-inside dimensions
  if (
    moduleId === 'M6_Net_1125_26' ||
    moduleId === 'M7_EBM_Net_1125_26' ||
    moduleId === 'M8_EBM_Net_UChannel'
  ) {
    return {
      ...defaultRequirements,
      requiresInsideToInside: true,
      widthLabel: 'Inside-to-Inside Width',
      heightLabel: 'Inside-to-Inside Height',
      requiresPanel: false,
    };
  }

  // M9: Curtain Wall Grid - requires N_v and N_h
  if (moduleId === 'M9_Curtain_Wall_Grid') {
    return {
      ...defaultRequirements,
      requiresVerticalPanels: true,
      requiresHorizontalPanels: true,
      requiresPanel: false,
      panelLabel: 'Vertical Panels',
    };
  }

  return defaultRequirements;
}

