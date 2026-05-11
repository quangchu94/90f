import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { fetchTeams } from '@/services/espn/espnClient';
import { mapTeamsResponse } from '@/services/espn/espnMappers';

export function useTeams(leagueSlug: Ref<string>, enabled?: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => ['teams', leagueSlug.value]),
    enabled: computed(() => enabled?.value ?? true),
    queryFn: async ({ signal }) => {
      const response = await fetchTeams(leagueSlug.value, signal);
      return mapTeamsResponse(response, leagueSlug.value);
    },
    staleTime: 24 * 60 * 60_000,
    placeholderData: (previousData) => previousData
  });
}
