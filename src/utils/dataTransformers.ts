/**
 * Data Transformation Utilities
 * Converts frontend UI data format to backend API format
 */

import type {
  DimensionItem,
  ProjectDescriptionData,
  SelectProjectData,
  ProjectMeasurementData,
  GlazingDimension,
  ProjectData,
} from '@/types/project';
import type { ProjectCartItem, CalculationSettings } from '@/types/calculations';
import { mapGlazingTypeToModuleId, getCategoryFromKey, normalizeGlazingType } from './moduleMapping';

/**
 * Converts DimensionItem to GlazingDimension format
 */
export function convertDimensionItemToGlazingDimension(
  item: DimensionItem,
  category: 'Window' | 'Door' | 'Net' | 'Partition' | 'Curtain Wall'
): GlazingDimension {
  const moduleId = mapGlazingTypeToModuleId(item.type, category);
  const glazingType = normalizeGlazingType(item.type, category);

  // Parse numeric values
  const width = parseFloat(item.width) || 0;
  const height = parseFloat(item.height) || 0;
  const quantity = parseFloat(item.quantity) || 1;
  const panels = parseFloat(item.panel) || 1;

  // Build parameters object based on module
  const parameters: GlazingDimension['parameters'] = {
    W: width,
    H: height,
    qty: quantity,
  };

  // Add module-specific parameters
  if (moduleId.startsWith('M1_') || moduleId.startsWith('M2_') || moduleId.startsWith('M3_') || 
      moduleId.startsWith('M4_') || moduleId.startsWith('M5_')) {
    // Window modules use N for panels
    parameters.N = panels;
    // O (opening panels) defaults to N if not specified
    parameters.O = panels;
  }

  // Add curtain wall specific parameters if needed
  if (moduleId.startsWith('M9_')) {
    // Curtain wall modules may need N_v and N_h
    // These would need to be collected from UI if required
  }

  return {
    glazingCategory: category,
    glazingType,
    moduleId,
    parameters,
  };
}

/**
 * Converts ProjectMeasurementData to array of GlazingDimensions
 * Uses SelectProjectData to determine categories
 */
export function convertToGlazingDimensions(
  measurementData: ProjectMeasurementData,
  selectData: SelectProjectData
): GlazingDimension[] {
  const glazingDimensions: GlazingDimension[] = [];

  // Map each dimension item to its category based on SelectProjectData
  measurementData.dimensions.forEach((dimension) => {
    // Determine category by checking which array in selectData contains this type
    // This is a simplified approach - in practice, you might need more sophisticated matching
    let category: 'Window' | 'Door' | 'Net' | 'Partition' | 'Curtain Wall' = 'Window';

    // Check which category this dimension belongs to
    // This assumes the dimension type matches one of the selected types
    if (selectData.windows.some((w) => dimension.type.toLowerCase().includes(w.toLowerCase()))) {
      category = 'Window';
    } else if (selectData.doors.some((d) => dimension.type.toLowerCase().includes(d.toLowerCase()))) {
      category = 'Door';
    } else if (selectData.skylights.some((s) => dimension.type.toLowerCase().includes(s.toLowerCase()))) {
      category = 'Net';
    } else if (selectData.glassPanels.some((g) => dimension.type.toLowerCase().includes(g.toLowerCase()))) {
      category = 'Curtain Wall';
    }

    const glazingDimension = convertDimensionItemToGlazingDimension(dimension, category);
    glazingDimensions.push(glazingDimension);
  });

  return glazingDimensions;
}

/**
 * Converts GlazingDimension to ProjectCartItem format
 */
export function convertGlazingDimensionToProjectCartItem(
  glazingDimension: GlazingDimension
): ProjectCartItem {
  return {
    module_id: glazingDimension.moduleId,
    ...glazingDimension.parameters,
  };
}

/**
 * Converts array of GlazingDimensions to ProjectCart format
 */
export function convertToProjectCart(glazingDimensions: GlazingDimension[]): ProjectCartItem[] {
  return glazingDimensions.map(convertGlazingDimensionToProjectCartItem);
}

/**
 * Creates ProjectData from project flow data
 */
export function createProjectData(
  descriptionData: ProjectDescriptionData,
  selectData: SelectProjectData,
  measurementData: ProjectMeasurementData,
  calculationSettings?: CalculationSettings
): ProjectData {
  const glazingDimensions = convertToGlazingDimensions(measurementData, selectData);

  return {
    projectName: descriptionData.projectName,
    customer: {
      name: descriptionData.customerName,
      // email, phone, address can be added later if collected in UI
    },
    siteAddress: descriptionData.siteAddress,
    description: descriptionData.description,
    glazingDimensions,
    calculationSettings: calculationSettings || {
      stockLength: 6,
      bladeKerf: 5,
      wasteThreshold: 200,
    },
  };
}

/**
 * Converts ProjectData to ProjectCart format for calculation API
 */
export function projectDataToProjectCart(
  projectData: ProjectData
): { projectCart: ProjectCartItem[]; settings: CalculationSettings } {
  const projectCart = convertToProjectCart(projectData.glazingDimensions);
  const settings = projectData.calculationSettings || {
    stockLength: 6,
    bladeKerf: 5,
    wasteThreshold: 200,
  };

  return { projectCart, settings };
}

