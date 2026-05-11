import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { fetchTeamSchedule } from '@/services/espn/espnClient';
import { mapTeamScheduleResponse } from '@/services/espn/espnMappers';

export function useTeamSchedule(leagueSlug: Ref<string>, teamId: Ref<string>, enabled?: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => ['team-schedule', leagueSlug.value, teamId.value]),
    enabled: computed(() => enabled?.value ?? true),
    queryFn: async ({ signal }) => {
      const response = await fetchTeamSchedule(leagueSlug.value, teamId.value, signal);
      return mapTeamScheduleResponse(response, leagueSlug.value);
    },
    staleTime: 10 * 60_000,
    placeholderData: (previousData) => previousData
  });
}
