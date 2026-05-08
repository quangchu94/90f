import { QueryClient } from '@tanstack/vue-query';
import { isRetryableEspnError } from '@/services/espn/espnClient';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: (failureCount, error) => failureCount < 2 && isRetryableEspnError(error),
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      refetchOnWindowFocus: false
    }
  }
});
