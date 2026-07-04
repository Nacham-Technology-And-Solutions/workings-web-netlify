import { useQuery } from '@tanstack/react-query';
import { projectsService, quotesService } from '@/services/api';
import type { Project as ApiProject } from '@/services/api/projects.service';
import { normalizeApiResponse, isApiResponseSuccess, getApiResponseData } from '@/utils/apiResponseHelper';
import { fetchMaterialListsCached } from '@/utils/materialListFetch';
import { queryKeys } from '@/lib/queryClient';
import type { Project, ProjectStatus } from '@/types';
import type { Quote } from '@/types';

const mapApiStatusToFrontend = (status: ApiProject['status']): ProjectStatus => {
  const statusMap: Record<ApiProject['status'], ProjectStatus> = {
    draft: 'Draft',
    calculated: 'Completed',
    archived: 'On Hold',
  };
  return statusMap[status] || 'Draft';
};

const transformApiProject = (apiProject: ApiProject): Project => ({
  id: apiProject.id.toString(),
  name: apiProject.projectName,
  address: apiProject.siteAddress,
  status: mapApiStatusToFrontend(apiProject.status),
  lastUpdated: apiProject.updatedAt || apiProject.createdAt,
  projectId: `#${String(apiProject.id).padStart(6, '0')}`,
});

async function fetchProjectsList(search?: string): Promise<Project[]> {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) return [];

  const response = await projectsService.list(1, 50, search);
  const normalizedResponse = normalizeApiResponse(response);
  if (!normalizedResponse.success) {
    throw new Error(normalizedResponse.message || 'Failed to load projects');
  }

  const responseData = normalizedResponse.response;
  let projectsArray: ApiProject[] = [];

  if (responseData && (responseData as { projects?: ApiProject[] }).projects) {
    projectsArray = (responseData as { projects: ApiProject[] }).projects;
  } else if (Array.isArray(responseData)) {
    projectsArray = responseData;
  } else {
    throw new Error('Invalid response format from server');
  }

  return projectsArray.map(transformApiProject);
}

async function fetchQuotesList(): Promise<Quote[]> {
  const response = await quotesService.list(1, 100);
  if (!isApiResponseSuccess(response)) {
    throw new Error('Failed to load quotes');
  }
  const responseData = getApiResponseData(response) as { quotes?: unknown[] };
  const quotesList = responseData?.quotes || (Array.isArray(responseData) ? responseData : []);
  const statusMap: Record<string, Quote['status']> = {
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    unpaid: 'Unpaid',
  };

  return (Array.isArray(quotesList) ? quotesList : []).map((backendQuote: Record<string, unknown>) => ({
    id: String(backendQuote.id),
    quoteNumber: (backendQuote.quoteNumber as string) || `Q-${backendQuote.id}`,
    projectName: (backendQuote.project as { projectName?: string } | undefined)?.projectName || 'Standalone Quote',
    customerName: backendQuote.customerName as string,
    status: statusMap[backendQuote.status as string] || 'Draft',
    total: (backendQuote.total as number) || 0,
    issueDate: new Date(backendQuote.createdAt as string).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  }));
}

export function useProjectsQuery(refreshTrigger = 0, search?: string) {
  return useQuery({
    queryKey: [...queryKeys.projects.list(search), refreshTrigger],
    queryFn: () => fetchProjectsList(search),
  });
}

export function useQuotesQuery(refreshTrigger = 0) {
  return useQuery({
    queryKey: [...queryKeys.quotes.list(), refreshTrigger],
    queryFn: fetchQuotesList,
  });
}

export function useMaterialListsQuery(refreshTrigger = 0) {
  return useQuery({
    queryKey: [...queryKeys.materialLists.list(), refreshTrigger],
    queryFn: () => fetchMaterialListsCached({ force: true }),
  });
}
