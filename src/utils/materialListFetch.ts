import { materialListsService } from '@/services/api';
import { isApiResponseSuccess, getApiResponseData } from '@/utils/apiResponseHelper';
import type { MaterialListSummary } from '@/services/api/materialLists.service';
import type { MaterialList } from '@/types';

const CACHE_TTL_MS = 60_000;

let cachedLists: MaterialList[] | null = null;
let cacheFetchedAt = 0;
let inflightFetch: Promise<MaterialList[]> | null = null;

function mapSummaryToMaterialList(summary: MaterialListSummary): MaterialList {
  const status: MaterialList['status'] =
    summary.projectStatus === 'calculated' || summary.calculated ? 'Completed' : 'Draft';

  return {
    id: String(summary.id),
    projectName: summary.projectName || 'Untitled Project',
    listNumber: `#${String(summary.id).padStart(6, '0')}`,
    status,
    issueDate: summary.updatedAt || summary.createdAt || new Date().toISOString(),
  };
}

async function fetchMaterialListsFromApi(): Promise<MaterialList[]> {
  const response = await materialListsService.list(1, 100, { status: 'calculated' });
  if (!isApiResponseSuccess(response)) {
    throw new Error('Failed to load material lists');
  }

  const data = getApiResponseData(response) as { materialLists?: MaterialListSummary[] };
  const summaries = data?.materialLists ?? [];
  return summaries.map(mapSummaryToMaterialList);
}

/** Fetch material lists via GET /material-lists with in-memory TTL cache. */
export async function fetchMaterialListsCached(options?: {
  force?: boolean;
}): Promise<MaterialList[]> {
  const force = options?.force ?? false;
  if (!force && cachedLists && Date.now() - cacheFetchedAt < CACHE_TTL_MS) {
    return cachedLists;
  }

  if (inflightFetch) {
    return inflightFetch;
  }

  inflightFetch = (async () => {
    try {
      const lists = await fetchMaterialListsFromApi();
      cachedLists = lists;
      cacheFetchedAt = Date.now();
      return lists;
    } finally {
      inflightFetch = null;
    }
  })();

  return inflightFetch;
}

export function invalidateMaterialListsCache(): void {
  cachedLists = null;
  cacheFetchedAt = 0;
}
