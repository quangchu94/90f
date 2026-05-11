import { useQuery } from '@tanstack/vue-query';
import { fetchSoccerLeagues } from '@/services/espn/espnClient';

export function useSoccerLeagues() {
  return useQuery({
    queryKey: ['soccer-leagues'],
    queryFn: ({ signal }: { signal?: AbortSignal }) => fetchSoccerLeagues(signal),
    staleTime: 24 * 60 * 60 * 1000
  });
}
