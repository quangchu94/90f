<template>
  <div class="space-y-5">
    <section class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-app-amber">Teams</p>
        <h1 class="mt-1 text-2xl font-black tracking-normal sm:text-3xl">Đội bóng</h1>
        <p class="mt-1 text-sm text-app-secondary">{{ leagueName }}</p>
      </div>
      <LeagueRouteSelector
        :model-value="effectiveLeagueSlug"
        :leagues="fixturesStore.favoriteLeagues"
        @update:model-value="handleLeagueChange"
      />
    </section>

    <div v-if="isLoading" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="index in 9" :key="index" class="h-24 animate-pulse rounded border border-app-border bg-app-surface" />
    </div>

    <StateBlock
      v-else-if="isError"
      title="Không thể tải danh sách đội"
      message="Vui lòng thử lại."
      action-label="Thử lại"
      @action="handleRefetch"
    />

    <StateBlock
      v-else-if="!teams?.length"
      title="Chưa có danh sách đội cho giải này."
      message="Chúng tôi chưa có dữ liệu đội bóng cho giải đấu này."
    />

    <section v-else class="space-y-4">
      <div v-if="favoriteTeams.length" class="space-y-3">
        <h2 class="text-sm font-bold text-app-secondary">Đội yêu thích</h2>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TeamCard
            v-for="team in favoriteTeams"
            :key="`favorite-${team.id}`"
            :team="team"
            :is-favorite="true"
            @toggle-favorite="preferences.toggleFavoriteTeam(effectiveLeagueSlug, team.id)"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TeamCard
          v-for="team in teams"
          :key="team.id"
          :team="team"
          :is-favorite="preferences.isFavoriteTeam(effectiveLeagueSlug, team.id)"
          @toggle-favorite="preferences.toggleFavoriteTeam(effectiveLeagueSlug, team.id)"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { DEFAULT_LEAGUE_SLUG, getLeagueBySlug, getLeagueShortName, isPlausibleLeagueSlug } from '@/domain/leagues';
import { useTeams } from '@/composables/useTeams';
import { useFixturesStore } from '@/stores/fixturesStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import LeagueRouteSelector from '@/components/football/LeagueRouteSelector.vue';
import StateBlock from '@/components/common/StateBlock.vue';
import TeamCard from './TeamCard.vue';

const props = defineProps<{
  leagueSlug: string;
}>();

const router = useRouter();
const fixturesStore = useFixturesStore();
const preferences = usePreferencesStore();
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
const { data: teams, isLoading, isError, refetch } = useTeams(effectiveLeagueSlug);
const leagueName = computed(() => {
  const league =
    fixturesStore.favoriteLeagues.find((favorite) => favorite.slug === effectiveLeagueSlug.value) ??
    getLeagueBySlug(effectiveLeagueSlug.value);
  return getLeagueShortName(league.slug, league.shortName, league.name);
});
const favoriteTeams = computed(() =>
  (teams.value ?? []).filter((team) => preferences.isFavoriteTeam(effectiveLeagueSlug.value, team.id))
);

watch(
  () => props.leagueSlug,
  (slug) => {
    if (!isPlausibleLeagueSlug(slug)) {
      void router.replace({ name: 'teams', params: { leagueSlug: favoriteFallbackLeagueSlug.value } });
    }
  },
  { immediate: true }
);

function handleLeagueChange(nextLeagueSlug: string): void {
  void router.push({ name: 'teams', params: { leagueSlug: nextLeagueSlug } });
}

function handleRefetch(): void {
  void refetch();
}
</script>
