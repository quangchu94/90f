import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import {
  fetchSoccerLeagueDetailsForPicker,
  fetchSoccerLeagues
} from '@/services/espn/espnClient';
import {
  getPriorityLeagues,
  INITIAL_LEAGUES,
  mergeLeagueSummaries
} from '@/domain/leagues';
import type { LeagueSummary } from '@/domain/models';

export function useSoccerLeagues() {
  const catalogQuery = useQuery({
    queryKey: ['soccer-leagues', 'catalog'],
    queryFn: ({ signal }: { signal?: AbortSignal }) => fetchSoccerLeagues(signal),
    staleTime: 24 * 60 * 60 * 1000,
    placeholderData: (previousData: LeagueSummary[] | undefined) => previousData ?? INITIAL_LEAGUES
  });
  const catalogLeagues = computed(() => catalogQuery.data.value ?? INITIAL_LEAGUES);
  const priorityLeagues = computed(() =>
    mergeLeagueSummaries([...INITIAL_LEAGUES, ...getPriorityLeagues(catalogLeagues.value)])
  );
  const detailQuery = useQuery({
    queryKey: computed(() => [
      'soccer-leagues',
      'details',
      catalogLeagues.value.map((league) => league.slug).join('|')
    ]),
    enabled: computed(() => !catalogQuery.isLoading.value && Boolean(catalogQuery.data.value?.length)),
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchSoccerLeagueDetailsForPicker(catalogLeagues.value, signal),
    staleTime: 24 * 60 * 60 * 1000
  });
  const baseLeagues = computed(() =>
    catalogQuery.data.value && !detailQuery.isFetching.value ? catalogQuery.data.value : priorityLeagues.value
  );
  const data = computed(() =>
    mergeLeagueSummaries([...baseLeagues.value, ...(detailQuery.data.value ?? [])])
  );
  const isLoading = computed(() => catalogQuery.isLoading.value && !data.value.length);
  const isError = computed(() => catalogQuery.isError.value && !data.value.length);
  const isFetching = computed(() => catalogQuery.isFetching.value || detailQuery.isFetching.value);

  function refetch(): void {
    void catalogQuery.refetch();
    void detailQuery.refetch();
  }

  return {
    data,
    isLoading,
    isFetching,
    isError,
    refetch
  };
}
