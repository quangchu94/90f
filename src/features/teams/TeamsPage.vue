<template>
  <div class="space-y-5">
    <section class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-app-amber">Teams</p>
        <h1 class="mt-1 text-2xl font-black tracking-normal sm:text-3xl">Đội bóng</h1>
        <p class="mt-1 text-sm text-app-secondary">{{ leagueName }}</p>
      </div>
      <LeagueRouteSelector :model-value="leagueSlug" @update:model-value="handleLeagueChange" />
    </section>

    <StateBlock
      v-if="!isSupportedLeague"
      title="Giải đấu chưa được hỗ trợ"
      message="Vui lòng chọn một giải đấu khác trong danh sách."
    />

    <div v-else-if="isLoading" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      message="ESPN chưa trả dữ liệu đội bóng cho giải đấu này."
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
            @toggle-favorite="preferences.toggleFavoriteTeam(leagueSlug, team.id)"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TeamCard
          v-for="team in teams"
          :key="team.id"
          :team="team"
          :is-favorite="preferences.isFavoriteTeam(leagueSlug, team.id)"
          @toggle-favorite="preferences.toggleFavoriteTeam(leagueSlug, team.id)"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useRouter } from 'vue-router';
import { INITIAL_LEAGUES, getLeagueBySlug } from '@/domain/leagues';
import { useTeams } from '@/composables/useTeams';
import { usePreferencesStore } from '@/stores/preferencesStore';
import LeagueRouteSelector from '@/components/football/LeagueRouteSelector.vue';
import StateBlock from '@/components/common/StateBlock.vue';
import TeamCard from './TeamCard.vue';

const props = defineProps<{
  leagueSlug: string;
}>();

const router = useRouter();
const preferences = usePreferencesStore();
const { leagueSlug } = toRefs(props);
const isSupportedLeague = computed(() =>
  INITIAL_LEAGUES.some((league) => league.slug === props.leagueSlug)
);
const { data: teams, isLoading, isError, refetch } = useTeams(leagueSlug, isSupportedLeague);
const leagueName = computed(() => getLeagueBySlug(props.leagueSlug).name);
const favoriteTeams = computed(() =>
  (teams.value ?? []).filter((team) => preferences.isFavoriteTeam(props.leagueSlug, team.id))
);

function handleLeagueChange(nextLeagueSlug: string): void {
  void router.push({ name: 'teams', params: { leagueSlug: nextLeagueSlug } });
}

function handleRefetch(): void {
  void refetch();
}
</script>
