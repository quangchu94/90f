import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { fetchTeamRoster } from '@/services/espn/espnClient';
import { mapRosterResponse } from '@/services/espn/espnMappers';

export function useTeamRoster(leagueSlug: Ref<string>, teamId: Ref<string>, enabled?: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => ['team-roster', leagueSlug.value, teamId.value]),
    enabled: computed(() => enabled?.value ?? true),
    queryFn: async ({ signal }) => {
      const response = await fetchTeamRoster(leagueSlug.value, teamId.value, signal);
      return mapRosterResponse(response);
    },
    staleTime: 24 * 60 * 60_000,
    placeholderData: (previousData) => previousData
  });
}
