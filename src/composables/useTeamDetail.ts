import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { fetchTeamDetail } from '@/services/espn/espnClient';
import { mapTeamDetailResponse } from '@/services/espn/espnMappers';

export function useTeamDetail(leagueSlug: Ref<string>, teamId: Ref<string>, enabled?: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => ['team-detail', leagueSlug.value, teamId.value]),
    enabled: computed(() => enabled?.value ?? true),
    queryFn: async ({ signal }) => {
      const response = await fetchTeamDetail(leagueSlug.value, teamId.value, signal);
      return mapTeamDetailResponse(response, leagueSlug.value, teamId.value);
    },
    staleTime: 24 * 60 * 60_000,
    placeholderData: (previousData) => previousData
  });
}
