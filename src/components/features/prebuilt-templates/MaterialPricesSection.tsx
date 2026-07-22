import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import type { MaterialPrice } from '@/types/templates';
import * as XLSX from 'xlsx';
import {
  MATERIAL_PRICE_CATEGORIES,
  normalizeItemKey,
  hasEstimationItemKey,
  findDuplicateItemKey,
  buildCatalogLookup,
  groupCatalogItems,
  toMaterialPriceCategory,
  enrichMaterialPricesFromCatalog,
} from '@/utils/materialPriceHelpers';
import SearchableMaterialSelect from './SearchableMaterialSelect';
import { FormattedAmountInput } from '@/components/common/FormattedAmountInput';

type MaterialPriceForm = {
  itemKey: string;
  unitPrice: number;
  description: string;
};

const EMPTY_FORM: MaterialPriceForm = {
  itemKey: '',
  unitPrice: 0,
  description: '',
};

const MaterialPricesSection: React.FC = () => {
  const {
    materialPrices,
    isLoadingMaterialPrices,
    materialCatalogItems,
    isLoadingCatalog,
    loadMaterialCatalog,
    loadMaterialPrices,
    addMaterialPrice,
    updateMaterialPrice,
    deleteMaterialPrice,
    bulkImportMaterialPrices,
  } = useTemplateStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<MaterialPrice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState<MaterialPriceForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const isFirstFetch = useRef(true);

  useEffect(() => {
    void loadMaterialCatalog().catch(() => {
      setCatalogError('Could not load the material catalog. Refresh the page to try again.');
    });
  }, [loadMaterialCatalog]);

  const catalogItems = materialCatalogItems;

  useEffect(() => {
    const delay = isFirstFetch.current ? 0 : 300;
    isFirstFetch.current = false;
    const timer = window.setTimeout(() => {
      void loadMaterialPrices({
        category: selectedCategory,
        search: searchQuery,
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [loadMaterialPrices, selectedCategory, searchQuery]);

  const catalogByKey = useMemo(() => buildCatalogLookup(catalogItems), [catalogItems]);

  const displayPrices = useMemo(
    () => enrichMaterialPricesFromCatalog(materialPrices, catalogItems),
    [materialPrices, catalogItems]
  );

  const usedItemKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const price of materialPrices) {
      if (price.id === editingPrice?.id) continue;
      if (price.itemKey) keys.add(normalizeItemKey(price.itemKey));
    }
    return keys;
  }, [materialPrices, editingPrice?.id]);

  const availableCatalogItems = useMemo(() => {
    if (editingPrice) return catalogItems;
    return catalogItems.filter((item) => !usedItemKeys.has(normalizeItemKey(item.itemKey)));
  }, [catalogItems, usedItemKeys, editingPrice]);

  const groupedAvailableCatalog = useMemo(
    () => groupCatalogItems(availableCatalogItems),
    [availableCatalogItems]
  );

  const selectedCatalogItem = formData.itemKey
    ? catalogByKey.get(normalizeItemKey(formData.itemKey))
    : undefined;

  const refreshPrices = () =>
    loadMaterialPrices({ category: selectedCategory, search: searchQuery });

  const showStatus = (message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleAddNew = () => {
    setFormData(EMPTY_FORM);
    setFormError(null);
    setEditingPrice(null);
    setShowAddModal(true);
  };

  const handleEdit = (price: MaterialPrice) => {
    setFormData({
      itemKey: price.itemKey ?? '',
      unitPrice: price.unitPrice,
      description: price.description || '',
    });
    setFormError(null);
    setEditingPrice(price);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this material price?')) {
      await deleteMaterialPrice(id);
      await refreshPrices();
      showStatus('Material price deleted.');
    }
  };

  const validateForm = (): boolean => {
    if (!editingPrice && !formData.itemKey.trim()) {
      setFormError('Select a material from the catalog.');
      return false;
    }
    if (!editingPrice && !selectedCatalogItem) {
      setFormError('Selected material is not in the estimation catalog.');
      return false;
    }
    if (formData.unitPrice <= 0) {
      setFormError('Unit price must be greater than 0.');
      return false;
    }
    const itemKey = editingPrice?.itemKey ?? formData.itemKey;
    const duplicate = findDuplicateItemKey(materialPrices, itemKey, editingPrice?.id);
    if (duplicate) {
      setFormError(
        `"${selectedCatalogItem?.itemName ?? duplicate.name}" is already in your library.`
      );
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || isSaving) return;

    const catalogItem = editingPrice
      ? catalogByKey.get(normalizeItemKey(editingPrice.itemKey ?? ''))
      : selectedCatalogItem;

    const itemKey = normalizeItemKey(editingPrice?.itemKey ?? formData.itemKey);
    const payload = {
      name: catalogItem?.itemName ?? editingPrice?.name ?? itemKey,
      itemKey,
      category: catalogItem
        ? toMaterialPriceCategory(catalogItem.category)
        : editingPrice!.category,
      unit: catalogItem?.unit ?? editingPrice!.unit,
      unitPrice: formData.unitPrice,
      description: formData.description.trim() || undefined,
      source: 'user' as const,
    };

    setIsSaving(true);
    try {
      if (editingPrice) {
        await updateMaterialPrice(editingPrice.id, payload);
        showStatus('Material price updated.');
      } else {
        await addMaterialPrice(payload);
        showStatus('Material price added.');
      }

      setShowAddModal(false);
      setFormData(EMPTY_FORM);
      setEditingPrice(null);
      setFormError(null);
      void refreshPrices();
    } catch (error) {
      console.error('Failed to save material price:', error);
      setFormError('Could not save material price. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setEditingPrice(null);
  };

  const handleExport = (format: 'csv' | 'excel') => {
    if (materialPrices.length === 0) {
      alert('No material prices to export.');
      return;
    }

    const data = materialPrices.map((price) => ({
      'Material Name': price.name,
      'Item Key': price.itemKey ?? '',
      Category: price.category,
      Unit: price.unit,
      'Unit Price (₦)': price.unitPrice,
      Description: price.description || '',
      'Last Updated': new Date(price.updatedAt).toLocaleDateString(),
    }));

    const filename = `material-prices-${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map((row) => Object.values(row).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Material Prices');
      XLSX.writeFile(wb, `${filename}.xlsx`);
    }
  };

  const parseImportRow = (
    row: Record<string, unknown>,
    lookup: Map<string, MaterialCatalogItem>
  ): Omit<MaterialPrice, 'id' | 'createdAt' | 'updatedAt' | 'priceHistory'> | null => {
    const itemKey = normalizeItemKey(String(row['Item Key'] ?? row.itemKey ?? ''));
    const unitPrice = parseFloat(String(row['Unit Price (₦)'] ?? row.unitPrice ?? 0));
    const description = String(row.Description ?? row.description ?? '').trim();

    const catalogItem = lookup.get(itemKey);
    if (!catalogItem || unitPrice <= 0) {
      return null;
    }

    return {
      name: catalogItem.itemName,
      itemKey,
      category: toMaterialPriceCategory(catalogItem.category),
      unit: catalogItem.unit,
      unitPrice,
      description: description || undefined,
      source: 'user',
    };
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (catalogItems.length === 0) {
      alert('Material catalog is not loaded yet. Please wait and try again.');
      return;
    }

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      const parsed = jsonData
        .map((row) => parseImportRow(row, catalogByKey))
        .filter((row): row is NonNullable<typeof row> => row !== null);
      const skipped = jsonData.length - parsed.length;

      if (parsed.length === 0) {
        alert(
          'No valid rows found. Each row needs a catalog Item Key and Unit Price (₦). Material name and category are taken from the catalog.'
        );
        return;
      }

      const confirmMsg =
        skipped > 0
          ? `Import ${parsed.length} material price(s)? ${skipped} row(s) will be skipped (unknown item key or invalid price).`
          : `Import ${parsed.length} material price(s)?`;

      if (!window.confirm(confirmMsg)) return;

      const result = await bulkImportMaterialPrices(parsed);
      if (result) {
        showStatus(`Imported ${result.imported} price(s)${result.failed > 0 ? `, ${result.failed} failed` : ''}.`);
        await refreshPrices();
      } else {
        alert('Import failed. Please check your connection and try again.');
      }
    } catch (error) {
      alert('Error importing file. Please check the format and try again.');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const matchedCount = displayPrices.filter(hasEstimationItemKey).length;
  const missingKeyCount = displayPrices.length - matchedCount;
  const editingCatalogItem = editingPrice
    ? catalogByKey.get(normalizeItemKey(editingPrice.itemKey ?? ''))
    : undefined;
  const displayMaterial = editingCatalogItem ?? selectedCatalogItem;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900">Used by estimation engine</h4>
        <p className="mt-1 text-sm text-blue-800">
          These prices populate <strong>My prices</strong> when you generate a quote from a calculated
          project. Pick materials from the engine catalog — each has a stable item key for auto-fill.
          Labour, transport, and other project extras are set on the quote Extras tab after estimation pricing — not here.
        </p>
        {catalogItems.length > 0 && (
          <p className="mt-2 text-xs text-blue-700">
            {catalogItems.length} catalog materials available across all modules.
          </p>
        )}
        {materialPrices.length > 0 && (
          <p className="mt-1 text-xs text-blue-700">
            {matchedCount} row{matchedCount !== 1 ? 's' : ''} ready for auto-fill
            {missingKeyCount > 0 ? ` · ${missingKeyCount} missing item key` : ''}.
          </p>
        )}
      </div>

      {catalogError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {catalogError}
          <button
            type="button"
            onClick={() => void loadCatalog()}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {statusMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {statusMessage}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Material Prices Library</h3>
              <p className="text-sm text-gray-600 mt-1">
                {isLoadingMaterialPrices
                  ? 'Loading…'
                  : `${materialPrices.length} material${materialPrices.length !== 1 ? 's' : ''} in library`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label
                className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer ${
                  isImporting || isLoadingCatalog ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {isImporting ? 'Importing…' : 'Import'}
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => void handleImport(e)}
                  className="hidden"
                  disabled={isImporting || isLoadingCatalog}
                />
              </label>
              <button
                type="button"
                onClick={() => handleExport('excel')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Export Excel
              </button>
              <button
                type="button"
                onClick={() => void refreshPrices()}
                disabled={isLoadingMaterialPrices}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={handleAddNew}
                disabled={isLoadingCatalog || catalogItems.length === 0}
                className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                + Add Material
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or item key…"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <option value="all">All Categories</option>
                {MATERIAL_PRICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoadingMaterialPrices && materialPrices.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading material prices…</div>
        ) : materialPrices.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-sm font-medium text-gray-900">No materials found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Add your first material price from the estimation catalog'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <button
                type="button"
                onClick={handleAddNew}
                disabled={isLoadingCatalog || catalogItems.length === 0}
                className="mt-6 inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                + Add Material
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayPrices.map((price) => {
                  const ready = hasEstimationItemKey(price);
                  const catalogMatch = price.itemKey
                    ? catalogByKey.get(normalizeItemKey(price.itemKey))
                    : undefined;
                  return (
                    <tr key={price.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {catalogMatch?.itemName ?? price.name}
                        </div>
                        {price.description && (
                          <div className="text-xs text-gray-500">{price.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded">
                          {price.itemKey || '—'}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            ready
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ready ? 'Ready' : 'Missing key'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                          {catalogMatch?.category ?? price.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {catalogMatch?.unit ?? price.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₦{price.unitPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(price.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(price)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(price.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingPrice ? 'Edit Material Price' : 'Add Material Price'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              {editingPrice ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase">Material</span>
                    <p className="text-sm font-medium text-gray-900">
                      {displayMaterial?.itemName ?? editingPrice.name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>
                      Category:{' '}
                      <strong>{displayMaterial?.category ?? editingPrice.category}</strong>
                    </span>
                    <span>
                      Unit: <strong>{displayMaterial?.unit ?? editingPrice.unit}</strong>
                    </span>
                  </div>
                  <code className="text-xs text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">
                    {editingPrice.itemKey}
                  </code>
                </div>
              ) : isLoadingCatalog ? (
                <p className="text-sm text-gray-500 py-2">Loading material catalog…</p>
              ) : availableCatalogItems.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  All catalog materials already have prices in your library.
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="material-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Material <span className="text-red-500">*</span>
                    </label>
                    <SearchableMaterialSelect
                      id="material-select"
                      groups={groupedAvailableCatalog}
                      value={formData.itemKey}
                      onChange={(itemKey) => setFormData({ ...formData, itemKey })}
                      placeholder="Search or select a material…"
                    />
                  </div>
                  {displayMaterial && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 space-y-1">
                      <div>
                        Category: <strong>{displayMaterial.category}</strong>
                      </div>
                      <div>
                        Unit: <strong>{displayMaterial.unit}</strong>
                      </div>
                      <code className="text-xs text-gray-700">{displayMaterial.itemKey}</code>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price (₦) <span className="text-red-500">*</span>
                </label>
                <FormattedAmountInput
                  value={formData.unitPrice || ''}
                  onValueChange={(val) => setFormData({ ...formData, unitPrice: val })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notes for your team"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={
                  isSaving ||
                  (!editingPrice && (isLoadingCatalog || availableCatalogItems.length === 0))
                }
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : editingPrice ? 'Update' : 'Add'} Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialPricesSection;
