import { computed, type Ref } from 'vue';
import { useQueries, useQuery } from '@tanstack/vue-query';
import type { FootballMatch } from '@/domain/models';
import { isLiveStatus } from '@/domain/status';
import { fetchLiveScoreboard, fetchScoreboard } from '@/services/espn/espnClient';
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

export function useLiveLeagueScoreboards(selectedDate: Ref<string>, leagueSlugs: Ref<string[]>) {
  const dateParam = computed(() => toDateParam(selectedDate.value));
  const queryResults = useQueries({
    queries: computed(() =>
      leagueSlugs.value.map((leagueSlug) => ({
        queryKey: ['live-scoreboard-league', leagueSlug, dateParam.value],
        queryFn: async ({ signal }: { signal?: AbortSignal }) => {
          const response = await fetchScoreboard(leagueSlug, dateParam.value, signal);
          return mapScoreboardResponse(response, leagueSlug);
        },
        staleTime: 15_000,
        refetchInterval: (query: { state: { data?: FootballMatch[] } }) => {
          if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
            return false;
          }

          return query.state.data?.some((match) => isLiveStatus(match.status)) ? LIVE_REFETCH_INTERVAL_MS : false;
        },
        placeholderData: (previousData: FootballMatch[] | undefined) => previousData
      }))
    )
  });

  const matches = computed(() =>
    queryResults.value.flatMap((queryResult) => queryResult.data ?? [])
  );
  const isFetching = computed(() => queryResults.value.some((queryResult) => queryResult.isFetching));
  const isError = computed(() => queryResults.value.some((queryResult) => queryResult.isError));

  function refetchAll(): void {
    for (const queryResult of queryResults.value) {
      void queryResult.refetch();
    }
  }

  return {
    matches,
    isFetching,
    isError,
    refetchAll
  };
}
