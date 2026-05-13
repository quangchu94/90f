import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { fetchPlayerSeasonStats } from '@/services/espn/espnClient';
import { mapPlayerSeasonStatsResponse } from '@/services/espn/espnMappers';

const PLAYER_SEASON_STATS_STALE_MS = 12 * 60 * 60_000;

export function usePlayerSeasonStats(
  leagueSlug: Ref<string>,
  playerId: Ref<string>,
  enabled?: Ref<boolean>
) {
  return useQuery({
    queryKey: computed(() => ['player-season-stats', leagueSlug.value, playerId.value]),
    queryFn: async ({ signal }) => {
      const response = await fetchPlayerSeasonStats(leagueSlug.value, playerId.value, signal);
      return mapPlayerSeasonStatsResponse(response, playerId.value);
    },
    enabled: computed(() => (enabled?.value ?? true) && Boolean(leagueSlug.value && playerId.value)),
    staleTime: PLAYER_SEASON_STATS_STALE_MS,
    retry: false
  });
}
