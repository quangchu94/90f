import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { fetchMatchSummary } from '@/services/espn/espnClient';
import { mapSummaryResponse } from '@/services/espn/espnMappers';

export function useMatchSummary(leagueSlug: Ref<string>, eventId: Ref<string>) {
  return useQuery({
    queryKey: computed(() => ['match-summary', leagueSlug.value, eventId.value]),
    queryFn: async ({ signal }) => {
      const response = await fetchMatchSummary(leagueSlug.value, eventId.value, signal);
      return mapSummaryResponse(response, leagueSlug.value, eventId.value);
    },
    staleTime: 60_000,
    placeholderData: (previousData) => previousData
  });
}
