/**
 * Quote Data Transformation Utilities
 * Converts project data (dimensions, material list) to quote item format
 */

import type { DimensionItem, ProjectMeasurementData } from '@/types/project';
import type { CalculationResult } from '@/types/calculations';
import type { QuoteItemRow } from '@/types/quote';
import {
  buildMaterialDisplaySections,
  formatRubberMeters,
  getNetPaneCount,
  mergeAccessoryDisplaySections,
} from '@/utils/calculationResultParser';

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

function pushDisplaySection(
  items: QuoteItemRow[],
  idCounter: { value: number },
  rows: { name: string; quantity: number; unit: string; quantityLabel?: string }[],
  suffix: string
): void {
  rows.forEach((row) => {
    const label = row.quantityLabel ?? `${row.quantity} ${row.unit}`;
    items.push({
      id: String(idCounter.value++),
      description: `${row.name} (${label}${suffix})`,
      quantity: row.quantity,
      unitPrice: 0,
      total: 0,
    });
  });
}

/**
 * Converts material list to quote item rows
 */
export function convertMaterialListToQuoteItems(
  calculationResult: CalculationResult
): QuoteItemRow[] {
  const items: QuoteItemRow[] = [];
  const idCounter = { value: 1 };
  const sections = buildMaterialDisplaySections(calculationResult);

  pushDisplaySection(items, idCounter, sections.profiles, '');

  mergeAccessoryDisplaySections(sections).forEach((row) => {
    const label =
      row.unit === 'm'
        ? `${formatRubberMeters(row.name, row.quantity)} m`
        : row.quantityLabel ?? `${row.quantity} ${row.unit}`;
    items.push({
      id: String(idCounter.value++),
      description: `${row.name} — ${label}`,
      quantity: row.quantity,
      unitPrice: 0,
      total: 0,
    });
  });

  const netPaneCount = getNetPaneCount(calculationResult.netList);
  if (netPaneCount > 0 && calculationResult.netList?.cuts) {
    calculationResult.netList.cuts.forEach((cut) => {
      items.push({
        id: String(idCounter.value++),
        description: `Net pane ${cut.w} × ${cut.h} mm`,
        quantity: cut.qty,
        unitPrice: 0,
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
        materialListLength: calculationResult?.materialList?.length ?? 0,
      });
    }
  }

  return [];
}
