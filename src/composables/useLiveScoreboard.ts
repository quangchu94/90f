import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import type { FootballMatch } from '@/domain/models';
import { isLiveStatus } from '@/domain/status';
import { fetchLiveScoreboard } from '@/services/espn/espnClient';
import { mapScoreboardResponse } from '@/services/espn/espnMappers';
import { toDateParam } from '@/utils/date';

const LIVE_REFETCH_INTERVAL_MS = 30_000;

export function useLiveScoreboard(selectedDate: Ref<string>) {
  const dateParam = computed(() => toDateParam(selectedDate.value));

  return useQuery({
    queryKey: computed(() => ['live-scoreboard', dateParam.value]),
    queryFn: async ({ signal }) => {
      const response = await fetchLiveScoreboard(dateParam.value, signal);
      return mapScoreboardResponse(response, 'all');
    },
    staleTime: (query) => {
      const matches = query.state.data as FootballMatch[] | undefined;
      return matches?.some((match) => isLiveStatus(match.status)) ? 15_000 : 60_000;
    },
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return false;
      }

      const matches = query.state.data as FootballMatch[] | undefined;
      return matches?.some((match) => isLiveStatus(match.status)) ? LIVE_REFETCH_INTERVAL_MS : false;
    },
    placeholderData: (previousData) => previousData
  });
}
