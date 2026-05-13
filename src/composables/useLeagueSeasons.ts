import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { fetchSoccerLeagueSeasons } from '@/services/espn/espnClient';
import type { SeasonOption } from '@/domain/models';

export function useLeagueSeasons(leagueSlug: Ref<string>, enabled?: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => ['league-seasons', leagueSlug.value]),
    enabled: computed(() => enabled?.value ?? true),
    queryFn: async ({ signal }) => {
      try {
        return await fetchSoccerLeagueSeasons(leagueSlug.value, signal);
      } catch {
        return fallbackSeasons();
      }
    },
    staleTime: 24 * 60 * 60_000,
    placeholderData: (previousData) => previousData,
    select: (seasons) => (seasons.length ? seasons : fallbackSeasons())
  });
}

export function fallbackSeasons(referenceYear = new Date().getFullYear()): SeasonOption[] {
  return Array.from({ length: 6 }, (_, index) => {
    const value = String(referenceYear - index);
    return { value, label: formatSeasonLabel(value) };
  });
}

export function formatSeasonLabel(value: string): string {
  const year = Number(value);

  if (!Number.isFinite(year)) {
    return value;
  }

  return `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
}
