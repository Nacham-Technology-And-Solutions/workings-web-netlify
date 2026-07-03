import type { ProjectDescriptionData, SelectProjectData, ProjectMeasurementData } from '@/types';
import type { Project } from '@/services/api/projects.service';
import {
  reconstructProjectMeasurementFromGlazing,
  applyApiCalculationSettingsToSelectProject,
} from '@/utils/dataTransformers';

export interface HydratedProjectFlow {
  projectDescription: ProjectDescriptionData;
  selectProject: SelectProjectData;
  projectMeasurement: ProjectMeasurementData;
  projectId: number;
}

export function hydrateProjectFlowFromApiProject(apiProject: Project): HydratedProjectFlow {
  const projectDescription: ProjectDescriptionData = {
    projectName: apiProject.projectName || '',
    customerName: apiProject.customer?.name || '',
    siteAddress: apiProject.siteAddress || '',
    description: apiProject.description || '',
  };

  const { selectProject, dimensions } = reconstructProjectMeasurementFromGlazing(
    apiProject.glazingDimensions ?? []
  );
  const hydratedSelect = applyApiCalculationSettingsToSelectProject(
    selectProject,
    apiProject.calculationSettings
  );

  return {
    projectDescription,
    selectProject: hydratedSelect,
    projectMeasurement: {
      dimensions,
      unit: hydratedSelect.unit ?? 'mm',
    },
    projectId: apiProject.id,
  };
}

const PROJECT_FLOW_CACHE_TTL_MS = 30_000;
const projectFlowCache = new Map<number, { flow: HydratedProjectFlow; fetchedAt: number }>();

export function getCachedProjectFlow(projectId: number): HydratedProjectFlow | null {
  const entry = projectFlowCache.get(projectId);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > PROJECT_FLOW_CACHE_TTL_MS) {
    projectFlowCache.delete(projectId);
    return null;
  }
  return entry.flow;
}

export function setCachedProjectFlow(flow: HydratedProjectFlow): void {
  projectFlowCache.set(flow.projectId, { flow, fetchedAt: Date.now() });
}

export function invalidateProjectFlowCache(projectId?: number): void {
  if (projectId != null) {
    projectFlowCache.delete(projectId);
    return;
  }
  projectFlowCache.clear();
}
