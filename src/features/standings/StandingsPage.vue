<template>
  <div class="space-y-5">
    <section class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-app-amber">League Table</p>
        <h1 class="mt-1 text-2xl font-black tracking-normal sm:text-3xl">Bảng xếp hạng</h1>
        <p class="mt-1 text-sm text-app-secondary">{{ leagueName }}</p>
      </div>
      <LeagueRouteSelector :model-value="effectiveLeagueSlug" @update:model-value="handleLeagueChange" />
    </section>

    <div v-if="isLoading" class="space-y-3">
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
      title="Chưa có bảng xếp hạng cho giải này."
      message="ESPN chưa trả dữ liệu bảng xếp hạng cho giải đấu này."
    />

    <section v-else class="space-y-5">
      <StandingsGroupTable
        v-for="group in groups"
        :key="group.id"
        :group="group"
        :league-slug="effectiveLeagueSlug"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getLeagueBySlug, getLeagueShortName, getSupportedLeagueFallback, isSupportedLeagueSlug } from '@/domain/leagues';
import { useStandings } from '@/composables/useStandings';
import LeagueRouteSelector from '@/components/football/LeagueRouteSelector.vue';
import StateBlock from '@/components/common/StateBlock.vue';
import StandingsGroupTable from './StandingsGroupTable.vue';

const props = defineProps<{
  leagueSlug: string;
}>();

const router = useRouter();
const effectiveLeagueSlug = computed(() =>
  isSupportedLeagueSlug(props.leagueSlug) ? props.leagueSlug : getSupportedLeagueFallback(props.leagueSlug)
);
const { data: groups, isLoading, isError, refetch } = useStandings(effectiveLeagueSlug);
const leagueName = computed(() => {
  const league = getLeagueBySlug(effectiveLeagueSlug.value);
  return getLeagueShortName(league.slug, league.shortName, league.name);
});

watch(
  () => props.leagueSlug,
  (slug) => {
    if (!isSupportedLeagueSlug(slug)) {
      void router.replace({ name: 'standings', params: { leagueSlug: getSupportedLeagueFallback(slug) } });
    }
  },
  { immediate: true }
);

function handleLeagueChange(nextLeagueSlug: string): void {
  void router.push({ name: 'standings', params: { leagueSlug: nextLeagueSlug } });
}

function handleRefetch(): void {
  void refetch();
}
</script>
