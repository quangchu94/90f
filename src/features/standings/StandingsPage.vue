<template>
  <div class="space-y-5">
    <section>
      <div>
        <p class="text-sm font-semibold text-app-amber">League Table</p>
        <h1 class="mt-1 text-2xl font-black tracking-normal sm:text-3xl">Bảng xếp hạng</h1>
        <p class="mt-1 text-sm text-app-secondary">Theo dõi thứ hạng theo giải đấu và mùa giải.</p>
      </div>
    </section>

    <section class="space-y-4">
      <header
        data-testid="standings-control-header"
        class="flex flex-col gap-3 rounded border border-app-border bg-app-elevated px-4 py-3 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <p class="text-xs font-bold uppercase text-app-muted">Bảng xếp hạng</p>
          <h2 class="mt-1 text-base font-black text-app-text">{{ leagueName }}</h2>
          <p class="mt-1 text-xs font-semibold text-app-secondary">{{ currentSeasonLabel }}</p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
          <LeagueRouteSelector
            :model-value="effectiveLeagueSlug"
            :leagues="fixturesStore.favoriteLeagues"
            @update:model-value="handleLeagueChange"
          />
          <div class="flex flex-col gap-2 text-sm font-semibold text-app-secondary">
            <span>Mùa giải</span>
            <div class="flex h-10 overflow-hidden rounded border border-app-border bg-app-surface">
              <button
                type="button"
                class="flex w-10 items-center justify-center text-lg font-black text-app-text transition hover:bg-app-bg focus:outline-none focus:ring-2 focus:ring-app-accent disabled:cursor-not-allowed disabled:text-app-muted disabled:opacity-50"
                aria-label="Lùi 1 mùa giải"
                :disabled="!previousSeason"
                @click="handleSeasonChange(previousSeason)"
              >
                ‹
              </button>
              <span class="flex min-w-24 items-center justify-center border-x border-app-border px-3 text-sm font-bold text-app-text">
                {{ currentSeasonLabel }}
              </span>
              <button
                type="button"
                class="flex w-10 items-center justify-center text-lg font-black text-app-text transition hover:bg-app-bg focus:outline-none focus:ring-2 focus:ring-app-accent disabled:cursor-not-allowed disabled:text-app-muted disabled:opacity-50"
                aria-label="Tiến 1 mùa giải"
                :disabled="!nextSeason"
                @click="handleSeasonChange(nextSeason)"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </header>

      <div v-if="isLoading || isSeasonsLoading" class="space-y-3">
        <div v-for="index in 8" :key="index" class="h-12 animate-pulse rounded border border-app-border bg-app-surface" />
      </div>

      <StateBlock
        v-else-if="isError"
        title="Không thể tải bảng xếp hạng"
        message="Vui lòng thử lại."
        action-label="Thử lại"
        @action="handleRefetch"
      />

      <StateBlock
        v-else-if="!groups?.length"
        :title="`Chưa có bảng xếp hạng cho mùa ${currentSeasonLabel}.`"
        :message="`Chúng tôi chưa có dữ liệu bảng xếp hạng cho ${leagueName} mùa ${currentSeasonLabel}.`"
      />

      <div v-else class="space-y-5">
        <StandingsGroupTable
          v-for="group in groups"
          :key="group.id"
          :group="group"
          :league-slug="effectiveLeagueSlug"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DEFAULT_LEAGUE_SLUG, getLeagueBySlug, getLeagueShortName, isPlausibleLeagueSlug } from '@/domain/leagues';
import { formatSeasonLabel, useLeagueSeasons } from '@/composables/useLeagueSeasons';
import { useStandings } from '@/composables/useStandings';
import { useFixturesStore } from '@/stores/fixturesStore';
import LeagueRouteSelector from '@/components/football/LeagueRouteSelector.vue';
import StateBlock from '@/components/common/StateBlock.vue';
import StandingsGroupTable from './StandingsGroupTable.vue';

const props = defineProps<{
  leagueSlug: string;
}>();

const route = useRoute();
const router = useRouter();
const fixturesStore = useFixturesStore();
const favoriteFallbackLeagueSlug = computed(() => {
  const favoriteSlugs = new Set(fixturesStore.favoriteLeagues.map((league) => league.slug));

  if (favoriteSlugs.has(fixturesStore.selectedLeagueSlug)) {
    return fixturesStore.selectedLeagueSlug;
  }

  return fixturesStore.favoriteLeagues[0]?.slug ?? DEFAULT_LEAGUE_SLUG;
});
const effectiveLeagueSlug = computed(() =>
  isPlausibleLeagueSlug(props.leagueSlug) ? props.leagueSlug : favoriteFallbackLeagueSlug.value
);
const { data: seasonOptions, isLoading: isSeasonsLoading } = useLeagueSeasons(effectiveLeagueSlug);
const requestedSeason = computed(() => readSeasonQuery(route.query.season));
const effectiveSeason = computed(() => {
  if (!seasonOptions.value?.length) {
    return undefined;
  }

  if (requestedSeason.value && seasonOptions.value.some((season) => season.value === requestedSeason.value)) {
    return requestedSeason.value;
  }

  return seasonOptions.value[0]?.value;
});
const isStandingsEnabled = computed(() => Boolean(effectiveSeason.value));
const { data: groups, isLoading, isError, refetch } = useStandings(
  effectiveLeagueSlug,
  effectiveSeason,
  isStandingsEnabled
);
const leagueName = computed(() => {
  const league =
    fixturesStore.favoriteLeagues.find((favorite) => favorite.slug === effectiveLeagueSlug.value) ??
    getLeagueBySlug(effectiveLeagueSlug.value);
  return getLeagueShortName(league.slug, league.shortName, league.name);
});
const currentSeasonIndex = computed(() =>
  seasonOptions.value?.findIndex((season) => season.value === effectiveSeason.value) ?? -1
);
const currentSeasonLabel = computed(
  () =>
    seasonOptions.value?.find((season) => season.value === effectiveSeason.value)?.label ??
    (effectiveSeason.value ? formatSeasonLabel(effectiveSeason.value) : 'Đang tải')
);
const previousSeason = computed(() =>
  currentSeasonIndex.value >= 0 ? seasonOptions.value?.[currentSeasonIndex.value + 1]?.value : undefined
);
const nextSeason = computed(() =>
  currentSeasonIndex.value > 0 ? seasonOptions.value?.[currentSeasonIndex.value - 1]?.value : undefined
);

watch(
  () => props.leagueSlug,
  (slug) => {
    if (!isPlausibleLeagueSlug(slug)) {
      void router.replace({ name: 'standings', params: { leagueSlug: favoriteFallbackLeagueSlug.value } });
    }
  },
  { immediate: true }
);

watch(
  [effectiveSeason, requestedSeason, seasonOptions],
  ([season, requested, options]) => {
    if (!options?.length || !season || requested === season) {
      return;
    }

    void router.replace({
      name: 'standings',
      params: { leagueSlug: effectiveLeagueSlug.value },
      query: { ...route.query, season }
    });
  },
  { immediate: true }
);

function handleLeagueChange(nextLeagueSlug: string): void {
  void router.push({
    name: 'standings',
    params: { leagueSlug: nextLeagueSlug },
    query: effectiveSeason.value ? { ...route.query, season: effectiveSeason.value } : route.query
  });
}

function handleSeasonChange(nextSeasonValue: string | undefined): void {
  if (!nextSeasonValue) {
    return;
  }

  void router.push({
    name: 'standings',
    params: { leagueSlug: effectiveLeagueSlug.value },
    query: { ...route.query, season: nextSeasonValue }
  });
}

function handleRefetch(): void {
  void refetch();
}

function readSeasonQuery(value: unknown): string | undefined {
  const season = Array.isArray(value) ? value[0] : value;
  return typeof season === 'string' && /^\d{4}$/.test(season) ? season : undefined;
}
</script>
