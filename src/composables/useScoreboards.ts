import { computed, type Ref } from 'vue';
import { useQueries } from '@tanstack/vue-query';
import type { FootballMatch } from '@/domain/models';
import { isLiveStatus } from '@/domain/status';
import { fetchScoreboard } from '@/services/espn/espnClient';
import { mapScoreboardResponse } from '@/services/espn/espnMappers';
import { toDateParam } from '@/utils/date';

export function useScoreboards(leagueSlug: Ref<string>, dates: Ref<string[]>) {
  const queryResults = useQueries({
    queries: computed(() =>
      dates.value.map((date) => {
        const dateParam = toDateParam(date);

        return {
          queryKey: ['scoreboard', leagueSlug.value, dateParam],
          queryFn: async ({ signal }: { signal?: AbortSignal }) => {
            const response = await fetchScoreboard(leagueSlug.value, dateParam, signal);
            return mapScoreboardResponse(response, leagueSlug.value);
          },
          staleTime: 60_000,
          refetchInterval: (query: { state: { data?: FootballMatch[] } }) =>
            query.state.data?.some((match) => isLiveStatus(match.status)) ? 30_000 : false,
          placeholderData: (previousData: FootballMatch[] | undefined) => previousData
        };
      })
    )
  });

  const matches = computed(() =>
    queryResults.value.flatMap((queryResult) => queryResult.data ?? [])
  );
  const isLoading = computed(() => queryResults.value.some((queryResult) => queryResult.isLoading));
  const isFetching = computed(() => queryResults.value.some((queryResult) => queryResult.isFetching));
  const isError = computed(() => queryResults.value.some((queryResult) => queryResult.isError));

  function refetchAll(): void {
    for (const queryResult of queryResults.value) {
      void queryResult.refetch();
    }
  }

  return {
    matches,
    isLoading,
    isFetching,
    isError,
    refetchAll
  };
}
