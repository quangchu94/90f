<template>
  <div class="space-y-5">
    <section class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-app-amber">League Table</p>
        <h1 class="mt-1 text-2xl font-black tracking-normal sm:text-3xl">Bảng xếp hạng</h1>
        <p class="mt-1 text-sm text-app-secondary">{{ leagueName }}</p>
      </div>
      <LeagueRouteSelector :model-value="leagueSlug" @update:model-value="handleLeagueChange" />
    </section>

    <StateBlock
      v-if="!isSupportedLeague"
      title="Giải đấu chưa được hỗ trợ"
      message="Vui lòng chọn một giải đấu khác trong danh sách."
    />

    <div v-else-if="isLoading" class="space-y-3">
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
        :league-slug="leagueSlug"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useRouter } from 'vue-router';
import { INITIAL_LEAGUES, getLeagueBySlug } from '@/domain/leagues';
import { useStandings } from '@/composables/useStandings';
import LeagueRouteSelector from '@/components/football/LeagueRouteSelector.vue';
import StateBlock from '@/components/common/StateBlock.vue';
import StandingsGroupTable from './StandingsGroupTable.vue';

const props = defineProps<{
  leagueSlug: string;
}>();

const router = useRouter();
const { leagueSlug } = toRefs(props);
const isSupportedLeague = computed(() =>
  INITIAL_LEAGUES.some((league) => league.slug === props.leagueSlug)
);
const { data: groups, isLoading, isError, refetch } = useStandings(leagueSlug, isSupportedLeague);
const leagueName = computed(() => getLeagueBySlug(props.leagueSlug).name);

function handleLeagueChange(nextLeagueSlug: string): void {
  void router.push({ name: 'standings', params: { leagueSlug: nextLeagueSlug } });
}

function handleRefetch(): void {
  void refetch();
}
</script>
