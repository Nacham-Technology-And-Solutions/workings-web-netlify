import React from 'react';
import SearchableMaterialSelect from '@/components/features/prebuilt-templates/SearchableMaterialSelect';
import type { MaterialCatalogItem } from '@/types/estimation';
import { groupCatalogItems } from '@/utils/materialPriceHelpers';

export type MaterialItemSourceMode = 'catalog' | 'custom';

interface MaterialItemDescriptionEditorProps {
  mode: MaterialItemSourceMode;
  onModeChange: (mode: MaterialItemSourceMode) => void;
  catalogItems: MaterialCatalogItem[];
  selectedItemKey: string;
  onCatalogSelect: (itemKey: string) => void;
  customDescription: string;
  onCustomDescriptionChange: (value: string) => void;
  disabled?: boolean;
  isLoadingCatalog?: boolean;
}

const MaterialItemDescriptionEditor: React.FC<MaterialItemDescriptionEditorProps> = ({
  mode,
  onModeChange,
  catalogItems,
  selectedItemKey,
  onCatalogSelect,
  customDescription,
  onCustomDescriptionChange,
  disabled = false,
  isLoadingCatalog = false,
}) => {
  const catalogGroups = groupCatalogItems(catalogItems);

  return (
    <div className="space-y-2 min-w-[200px]">
      <div className="flex gap-3 text-xs">
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="material-source"
            checked={mode === 'catalog'}
            onChange={() => onModeChange('catalog')}
            disabled={disabled}
            className="text-gray-900 focus:ring-gray-400"
          />
          <span className="text-gray-700">System material</span>
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="material-source"
            checked={mode === 'custom'}
            onChange={() => onModeChange('custom')}
            disabled={disabled}
            className="text-gray-900 focus:ring-gray-400"
          />
          <span className="text-gray-700">Custom name</span>
        </label>
      </div>

      {mode === 'catalog' ? (
        isLoadingCatalog ? (
          <p className="text-xs text-gray-500 py-2">Loading materials…</p>
        ) : catalogItems.length === 0 ? (
          <p className="text-xs text-amber-700 py-1">
            No system materials available. Use custom name or add prices in Settings → Export settings → Material Prices.
          </p>
        ) : (
          <SearchableMaterialSelect
            groups={catalogGroups}
            value={selectedItemKey}
            onChange={onCatalogSelect}
            placeholder="Search system materials…"
            disabled={disabled}
          />
        )
      ) : (
        <input
          type="text"
          value={customDescription}
          onChange={(e) => onCustomDescriptionChange(e.target.value)}
          placeholder="Enter custom item name"
          disabled={disabled}
          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
        />
      )}
    </div>
  );
};

export default MaterialItemDescriptionEditor;
