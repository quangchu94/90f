import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { fetchScoreboard } from '@/services/espn/espnClient';
import { mapScoreboardResponse } from '@/services/espn/espnMappers';
import { toDateParam } from '@/utils/date';
import { isLiveStatus } from '@/domain/status';

export function useScoreboard(leagueSlug: Ref<string>, selectedDate: Ref<string>) {
  const dateParam = computed(() => toDateParam(selectedDate.value));

  return useQuery({
    queryKey: computed(() => ['scoreboard', leagueSlug.value, dateParam.value]),
    queryFn: async ({ signal }) => {
      const response = await fetchScoreboard(leagueSlug.value, dateParam.value, signal);
      return mapScoreboardResponse(response, leagueSlug.value);
    },
    staleTime: 60_000,
    refetchInterval: (query) => {
      const matches = query.state.data;
      return matches?.some((match) => isLiveStatus(match.status)) ? 30_000 : false;
    },
    placeholderData: (previousData) => previousData
  });
}
