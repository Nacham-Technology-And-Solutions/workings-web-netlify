import type { FullMaterialList, MaterialList, MaterialListItem, MaterialListStatus } from '@/types/material';

export type MaterialListSource = 'from_project' | 'standalone';

export type ApiMaterialListItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type?: string;
  unit?: string;
};

export type ApiFormattedMaterialList = {
  id: number;
  projectId: number | null;
  listSource: MaterialListSource;
  status: 'draft' | 'completed';
  savedToLibrary: boolean;
  displayName: string | null;
  preparedBy: string | null;
  issueDate: string | null;
  projectName: string;
  items: ApiMaterialListItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
  project?: { id: number; projectName?: string };
};

export type MaterialListSummaryApi = {
  id: number;
  projectId: number | null;
  projectName: string;
  listSource: MaterialListSource;
  status: 'draft' | 'completed';
  itemCount: number;
  itemsTotal: number;
  preparedBy: string | null;
  issueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapApiStatus(status: 'draft' | 'completed'): MaterialListStatus {
  return status === 'completed' ? 'Completed' : 'Draft';
}

export function mapSummaryToMaterialList(summary: MaterialListSummaryApi): MaterialList {
  return {
    id: String(summary.id),
    projectName: summary.projectName || 'Untitled',
    listNumber: `#${String(summary.id).padStart(6, '0')}`,
    status: mapApiStatus(summary.status),
    listSource: summary.listSource,
    issueDate: summary.issueDate || summary.updatedAt || summary.createdAt,
  };
}

export function mapApiItemsToUiItems(items: ApiMaterialListItem[]): MaterialListItem[] {
  return items.map((item, index) => ({
    id: `item-${index + 1}`,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.totalPrice ?? item.quantity * item.unitPrice,
    unit: item.unit,
    type: item.type,
  }));
}

export function mapApiToFullMaterialList(api: ApiFormattedMaterialList): FullMaterialList {
  return {
    id: String(api.id),
    projectId: api.projectId ?? undefined,
    projectName: api.projectName,
    date: api.issueDate || api.createdAt,
    preparedBy: api.preparedBy || '',
    status: mapApiStatus(api.status),
    listSource: api.listSource,
    items: mapApiItemsToUiItems(api.items),
    total: api.total,
  };
}

export function mapUiItemsToApiItems(
  items: Array<Pick<MaterialListItem, 'description' | 'quantity' | 'unitPrice' | 'total'>>
): ApiMaterialListItem[] {
  return items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return {
      description: item.description,
      quantity,
      unitPrice,
      totalPrice: item.total ?? quantity * unitPrice,
    };
  });
}

/** Map engine calculation BOM lines to API create payload items */
export function mapEngineMaterialListToApiItems(
  engineLines: Array<{
    item: string;
    units: number;
    unitPrice?: number;
    totalPrice?: number;
    type?: string;
    unit?: string;
  }>
): ApiMaterialListItem[] {
  return engineLines.map((line) => {
    const quantity = Number(line.units) || 0;
    const unitPrice = Number(line.unitPrice) || 0;
    const totalPrice =
      line.totalPrice != null && Number.isFinite(Number(line.totalPrice))
        ? Number(line.totalPrice)
        : quantity * unitPrice;
    return {
      description: line.item,
      quantity,
      unitPrice,
      totalPrice,
      ...(line.type ? { type: line.type } : {}),
      ...(line.unit ? { unit: line.unit } : {}),
    };
  });
}

export function mapFullMaterialListToCreateRequest(
  list: FullMaterialList,
  options?: { status?: 'draft' | 'completed' }
) {
  const listSource = list.listSource ?? (list.projectId ? 'from_project' : 'standalone');
  return {
    listSource,
    ...(listSource === 'from_project' && list.projectId
      ? { projectId: list.projectId }
      : {}),
    ...(listSource === 'standalone' ? { displayName: list.projectName } : {}),
    preparedBy: list.preparedBy || undefined,
    issueDate: list.date ? new Date(list.date).toISOString() : new Date().toISOString(),
    status: options?.status ?? (list.status === 'Completed' ? 'completed' : 'draft'),
    items: mapUiItemsToApiItems(list.items),
    total: list.total,
  };
}
