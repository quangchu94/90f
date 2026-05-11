import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { fetchStandings } from '@/services/espn/espnClient';
import { mapStandingsResponse } from '@/services/espn/espnMappers';

export function useStandings(leagueSlug: Ref<string>, enabled?: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => ['standings', leagueSlug.value]),
    enabled: computed(() => enabled?.value ?? true),
    queryFn: async ({ signal }) => {
      const response = await fetchStandings(leagueSlug.value, signal);
      return mapStandingsResponse(response);
    },
    staleTime: 10 * 60_000,
    placeholderData: (previousData) => previousData
  });
}
