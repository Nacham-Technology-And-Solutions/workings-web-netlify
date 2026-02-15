import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FullMaterialList } from '@/types';

interface MaterialListState {
  // Selected material list for viewing
  selectedMaterialListId: string | null;
  
  // Material list preview data
  materialListPreviewData: FullMaterialList | null;
  
  // Currently editing material list
  editingMaterialList: FullMaterialList | null;
  
  // Data for duplicating a material list (navigate to create with this data)
  duplicateMaterialListData: FullMaterialList | null;
  
  // Actions
  setSelectedMaterialListId: (id: string | null) => void;
  setMaterialListPreviewData: (data: FullMaterialList | null) => void;
  setEditingMaterialList: (list: FullMaterialList | null) => void;
  setDuplicateMaterialListData: (data: FullMaterialList | null) => void;
  clearMaterialListState: () => void;
}

export const useMaterialListStore = create<MaterialListState>()(
  persist(
    (set) => ({
      // Initial state
      selectedMaterialListId: null,
      materialListPreviewData: null,
      editingMaterialList: null,
      duplicateMaterialListData: null,
      
      // Actions
      setSelectedMaterialListId: (id) => set({ selectedMaterialListId: id }),
      setMaterialListPreviewData: (data) => set({ materialListPreviewData: data }),
      setEditingMaterialList: (list) => set({ editingMaterialList: list }),
      setDuplicateMaterialListData: (data) => set({ duplicateMaterialListData: data }),
      clearMaterialListState: () => set({
        selectedMaterialListId: null,
        materialListPreviewData: null,
        editingMaterialList: null,
        duplicateMaterialListData: null,
      }),
    }),
    {
      name: 'material-list-storage',
      partialize: (state) => ({
        selectedMaterialListId: state.selectedMaterialListId,
        materialListPreviewData: state.materialListPreviewData,
      }),
    }
  )
);

