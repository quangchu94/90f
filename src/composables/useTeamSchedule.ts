import { computed, type Ref } from 'vue';
import { useQueries, useQuery } from '@tanstack/vue-query';
import { getTeamScheduleCandidateLeagues, INITIAL_LEAGUES } from '@/domain/leagues';
import type { TeamScheduleMatch } from '@/domain/models';
import {
  fetchSoccerLeagues,
  fetchTeamFixtureSchedule,
  fetchTeamScheduleLeague,
  mergeTeamScheduleResponses
} from '@/services/espn/espnClient';
import { mapTeamScheduleResponse } from '@/services/espn/espnMappers';
import type { EspnTeamScheduleResponse } from '@/services/espn/espnTypes';

export function useTeamSchedule(leagueSlug: Ref<string>, teamId: Ref<string>, enabled?: Ref<boolean>) {
  const isEnabled = computed(() => enabled?.value ?? true);
  const catalogQuery = useQuery({
    queryKey: ['soccer-leagues'],
    enabled: isEnabled,
    queryFn: async ({ signal }) => {
      return fetchSoccerLeagues(signal).catch(() => INITIAL_LEAGUES);
    },
    staleTime: 24 * 60 * 60_000,
    placeholderData: (previousData) => previousData ?? INITIAL_LEAGUES
  });

  const catalogLeagues = computed(() => catalogQuery.data.value ?? INITIAL_LEAGUES);
  const candidateLeagues = computed(() =>
    getTeamScheduleCandidateLeagues(leagueSlug.value, catalogLeagues.value)
  );

  const leagueScheduleQueries = useQueries({
    queries: computed(() =>
      candidateLeagues.value.map((league) => ({
        queryKey: ['team-schedule-league', league.slug, teamId.value],
        enabled: isEnabled.value,
        queryFn: ({ signal }: { signal?: AbortSignal }) => fetchTeamScheduleLeague(league, teamId.value, signal),
        staleTime: 10 * 60_000,
        placeholderData: (previousData: EspnTeamScheduleResponse | undefined) => previousData
      }))
    )
  });

  const fixtureScheduleQuery = useQuery({
    queryKey: computed(() => ['team-schedule-fixtures', teamId.value]),
    enabled: isEnabled,
    queryFn: ({ signal }) => fetchTeamFixtureSchedule(teamId.value, signal),
    staleTime: 10 * 60_000,
    placeholderData: (previousData) => previousData
  });

  const fulfilledSchedules = computed(() => [
    ...leagueScheduleQueries.value.flatMap((queryResult) => (queryResult.data ? [queryResult.data] : [])),
    ...(fixtureScheduleQuery.data.value ? [fixtureScheduleQuery.data.value] : [])
  ]);

  const data = computed<TeamScheduleMatch[] | undefined>(() => {
    if (!fulfilledSchedules.value.length) {
      return undefined;
    }

    return mapTeamScheduleResponse(
      mergeTeamScheduleResponses(fulfilledSchedules.value, catalogLeagues.value),
      leagueSlug.value
    );
  });
  const isLoading = computed(
    () =>
      isEnabled.value &&
      !fulfilledSchedules.value.length &&
      (catalogQuery.isLoading.value ||
        fixtureScheduleQuery.isLoading.value ||
        leagueScheduleQueries.value.some((queryResult) => queryResult.isLoading))
  );
  const isError = computed(
    () =>
      isEnabled.value &&
      !fulfilledSchedules.value.length &&
      !catalogQuery.isLoading.value &&
      !fixtureScheduleQuery.isLoading.value &&
      leagueScheduleQueries.value.length > 0 &&
      leagueScheduleQueries.value.every((queryResult) => queryResult.isError) &&
      fixtureScheduleQuery.isError.value
  );
  const isFetching = computed(
    () =>
      isEnabled.value &&
      (catalogQuery.isFetching.value ||
        fixtureScheduleQuery.isFetching.value ||
        leagueScheduleQueries.value.some((queryResult) => queryResult.isFetching))
  );

  function refetch(): void {
    void catalogQuery.refetch();
    void fixtureScheduleQuery.refetch();
    for (const queryResult of leagueScheduleQueries.value) {
      void queryResult.refetch();
    }
  }

  return {
    data,
    isLoading,
    isFetching,
    isError,
    refetch
  };
}
