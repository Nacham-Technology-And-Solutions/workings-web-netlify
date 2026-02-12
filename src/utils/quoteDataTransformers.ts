/**
 * Quote Data Transformation Utilities
 * Converts project data (dimensions, material list) to quote item format
 */

import type { DimensionItem, ProjectMeasurementData } from '@/types/project';
import type { CalculationResult } from '@/types/calculations';
import type { QuoteItemRow } from '@/types/quote';

/**
 * Converts dimension items to quote item rows
 */
export function convertDimensionsToQuoteItems(
  dimensions: DimensionItem[]
): QuoteItemRow[] {
  return dimensions.map((dim, index) => {
    // Build description from dimension data
    let description = `${dim.width} x ${dim.height}`;
    
    // Add type information
    if (dim.type) {
      description += ` (${dim.type})`;
    }
    
    // Add panel information if available
    if (dim.panel && dim.panel !== '1') {
      description += ` - ${dim.panel} Panel${parseInt(dim.panel) > 1 ? 's' : ''}`;
    }
    
    // Add opening panels for M1
    if (dim.openingPanels) {
      description += ` - ${dim.openingPanels} Opening`;
    }
    
    // Add grid info for M9
    if (dim.verticalPanels && dim.horizontalPanels) {
      description += ` - ${dim.verticalPanels}×${dim.horizontalPanels} Grid`;
    }

    return {
      id: String(index + 1),
      description,
      quantity: parseFloat(dim.quantity) || 1,
      unitPrice: 0, // User will enter price
      total: 0,
    };
  });
}

/**
 * Converts material list to quote item rows
 */
export function convertMaterialListToQuoteItems(
  calculationResult: CalculationResult
): QuoteItemRow[] {
  const items: QuoteItemRow[] = [];
  let idCounter = 1;

  // Add profile items
  if (calculationResult.materialList) {
    calculationResult.materialList
      .filter(item => item.type === 'Profile')
      .forEach((item) => {
        items.push({
          id: String(idCounter++),
          description: item.item,
          quantity: item.units,
          unitPrice: 0, // User will enter price
          total: 0,
        });
      });
  }

  // Add accessory items
  if (calculationResult.accessoryTotals) {
    calculationResult.accessoryTotals.forEach((item) => {
      items.push({
        id: String(idCounter++),
        description: item.name,
        quantity: item.qty,
        unitPrice: 0, // User will enter price
        total: 0,
      });
    });
  }

  // Add rubber items
  if (calculationResult.rubberTotals) {
    calculationResult.rubberTotals.forEach((item) => {
      items.push({
        id: String(idCounter++),
        description: `${item.name} (${item.total_meters.toFixed(2)}m)`,
        quantity: 1,
        unitPrice: 0, // User will enter price
        total: 0,
      });
    });
  }

  return items;
}

/**
 * Gets initial quote items based on list type and project data
 */
export function getInitialQuoteItems(
  listType: 'dimension' | 'material',
  projectMeasurement?: ProjectMeasurementData,
  calculationResult?: CalculationResult
): QuoteItemRow[] {
  if (listType === 'dimension') {
    if (projectMeasurement?.dimensions && Array.isArray(projectMeasurement.dimensions) && projectMeasurement.dimensions.length > 0) {
      return convertDimensionsToQuoteItems(projectMeasurement.dimensions);
    }
    // Log for debugging
    if (import.meta.env.DEV) {
      console.log('[getInitialQuoteItems] Dimension list requested but no dimensions found:', {
        hasProjectMeasurement: !!projectMeasurement,
        hasDimensions: !!projectMeasurement?.dimensions,
        dimensionsLength: projectMeasurement?.dimensions?.length || 0
      });
    }
  }

  if (listType === 'material') {
    if (calculationResult) {
      const items = convertMaterialListToQuoteItems(calculationResult);
      if (items.length > 0) {
        return items;
      }
    }
    // Log for debugging
    if (import.meta.env.DEV) {
      console.log('[getInitialQuoteItems] Material list requested but no material items found:', {
        hasCalculationResult: !!calculationResult,
        hasMaterialList: !!calculationResult?.materialList,
        hasAccessoryTotals: !!calculationResult?.accessoryTotals,
        hasRubberTotals: !!calculationResult?.rubberTotals
      });
    }
  }

  return [];
}

