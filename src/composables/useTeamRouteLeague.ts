import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import {
  enrichLeagueMetadata,
  getLeagueBySlug,
  getSupportedLeagueFallback,
  INITIAL_LEAGUES,
  isSupportedLeagueSlug,
  mergeLeagueSummaries
} from '@/domain/leagues';
import type { LeagueSummary } from '@/domain/models';
import { fetchSoccerLeagues } from '@/services/espn/espnClient';

export function useTeamRouteLeague(leagueSlug: Ref<string>) {
  const catalogQuery = useQuery({
    queryKey: ['soccer-leagues'],
    queryFn: ({ signal }: { signal?: AbortSignal }) => fetchSoccerLeagues(signal),
    staleTime: 24 * 60 * 60_000,
    placeholderData: (previousData: LeagueSummary[] | undefined) => previousData
  });

  const catalogLeagues = computed(() =>
    mergeLeagueSummaries([...INITIAL_LEAGUES, ...(catalogQuery.data.value ?? [])])
  );
  const catalogLeague = computed(() =>
    catalogLeagues.value.find((league) => league.slug === leagueSlug.value)
  );
  const hasStaticLeague = computed(() => isSupportedLeagueSlug(leagueSlug.value));
  const hasCatalogLeague = computed(() => Boolean(catalogLeague.value));
  const hasPlausibleSlug = computed(() => isPlausibleLeagueSlug(leagueSlug.value));
  const isPendingCatalogValidation = computed(
    () => !hasStaticLeague.value && !hasCatalogLeague.value && catalogQuery.isLoading.value
  );
  const canUseLeague = computed(
    () =>
      hasStaticLeague.value ||
      hasCatalogLeague.value ||
      (hasPlausibleSlug.value && (isPendingCatalogValidation.value || catalogQuery.isError.value))
  );
  const shouldRedirect = computed(() => !canUseLeague.value && !isPendingCatalogValidation.value);
  const fallbackLeagueSlug = computed(() => getSupportedLeagueFallback(leagueSlug.value));
  const effectiveLeague = computed(() => {
    if (catalogLeague.value) {
      return catalogLeague.value;
    }

    if (hasStaticLeague.value) {
      return getLeagueBySlug(leagueSlug.value);
    }

    if (hasPlausibleSlug.value && (isPendingCatalogValidation.value || catalogQuery.isError.value)) {
      return enrichLeagueMetadata({ slug: leagueSlug.value, name: leagueSlug.value });
    }

    return getLeagueBySlug(fallbackLeagueSlug.value);
  });
  const effectiveLeagueSlug = computed(() => effectiveLeague.value.slug);

  return {
    effectiveLeague,
    effectiveLeagueSlug,
    canUseLeague,
    shouldRedirect,
    fallbackLeagueSlug
  };
}

function isPlausibleLeagueSlug(slug: string | undefined): boolean {
  return Boolean(slug && /^[a-z0-9]+(?:[._-][a-z0-9]+)+$/i.test(slug));
}
