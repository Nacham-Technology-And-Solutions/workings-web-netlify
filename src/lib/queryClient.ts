import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const queryKeys = {
  projects: {
    list: (search?: string) => ['projects', 'list', search ?? ''] as const,
  },
  quotes: {
    list: () => ['quotes', 'list'] as const,
  },
  materialLists: {
    list: () => ['materialLists', 'list'] as const,
  },
};
