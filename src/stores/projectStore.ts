import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ProjectDescriptionData,
  SelectProjectData,
  ProjectMeasurementData,
  ProjectData,
  GlazingDimension,
} from '@/types';

interface ProjectState {
  // Current project flow data
  projectDescriptionData: ProjectDescriptionData | null;
  selectProjectData: SelectProjectData | null;
  projectMeasurementData: ProjectMeasurementData | null;
  
  // Floor plan (for legacy/new project screen)
  floorPlan: {
    walls: Array<{ start: { x: number; y: number }; end: { x: number; y: number } }>;
    doors: Array<{ x: number; y: number; width: number; height: number }>;
    windows: Array<{ x: number; y: number; width: number; height: number }>;
  };
  
  // Active tool for floor plan
  activeTool: 'SELECT' | 'WALL' | 'DOOR' | 'WINDOW';
  
  // Material cost from step 4 (for quote generation)
  materialCostFromStep4: number;
  
  // Actions
  setProjectDescriptionData: (data: ProjectDescriptionData | null) => void;
  setSelectProjectData: (data: SelectProjectData | null) => void;
  setProjectMeasurementData: (data: ProjectMeasurementData | null) => void;
  setFloorPlan: (floorPlan: ProjectState['floorPlan']) => void;
  setActiveTool: (tool: ProjectState['activeTool']) => void;
  setMaterialCostFromStep4: (cost: number) => void;
  clearProjectFlow: () => void;
  getCombinedProjectData: () => {
    projectDescription?: ProjectDescriptionData;
    selectProject?: SelectProjectData;
    projectMeasurement?: ProjectMeasurementData;
  } | null;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Initial state
      projectDescriptionData: null,
      selectProjectData: null,
      projectMeasurementData: null,
      floorPlan: { walls: [], doors: [], windows: [] },
      activeTool: 'SELECT',
      materialCostFromStep4: 0,
      
      // Actions
      setProjectDescriptionData: (data) => set({ projectDescriptionData: data }),
      setSelectProjectData: (data) => set({ selectProjectData: data }),
      setProjectMeasurementData: (data) => set({ projectMeasurementData: data }),
      setFloorPlan: (floorPlan) => set({ floorPlan }),
      setActiveTool: (tool) => set({ activeTool: tool }),
      setMaterialCostFromStep4: (cost) => set({ materialCostFromStep4: cost }),
      
      clearProjectFlow: () => set({
        projectDescriptionData: null,
        selectProjectData: null,
        projectMeasurementData: null,
        materialCostFromStep4: 0,
      }),
      
      getCombinedProjectData: () => {
        const state = get();
        if (!state.projectDescriptionData || !state.selectProjectData || !state.projectMeasurementData) {
          return null;
        }
        return {
          projectDescription: state.projectDescriptionData,
          selectProject: state.selectProjectData,
          projectMeasurement: state.projectMeasurementData,
        };
      },
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({
        projectDescriptionData: state.projectDescriptionData,
        selectProjectData: state.selectProjectData,
        projectMeasurementData: state.projectMeasurementData,
        materialCostFromStep4: state.materialCostFromStep4,
      }),
    }
  )
);

