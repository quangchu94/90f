<template>
  <div class="space-y-5">
    <RouterLink
      :to="{ name: 'team-detail', params: { leagueSlug: effectiveLeagueSlug, teamId: props.teamId } }"
      class="inline-flex items-center rounded border border-app-border px-3 py-2 text-sm font-semibold text-app-secondary transition hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
    >
      Quay lại đội hình
    </RouterLink>

    <StateBlock
      v-if="!isSupportedLeague"
      title="Giải đấu chưa được hỗ trợ"
      message="Vui lòng chọn một giải đấu khác."
    />

    <div v-else-if="teamIsLoading || rosterIsLoading" class="h-40 animate-pulse rounded border border-app-border bg-app-surface" />

    <StateBlock
      v-else-if="teamIsError"
      title="Không thể tải thông tin đội"
      message="Vui lòng thử lại."
      action-label="Thử lại"
      @action="handleTeamRefetch"
    />

    <section v-else class="space-y-5">
      <header class="rounded border border-app-border bg-app-surface p-4 shadow-soft sm:p-6">
        <div class="flex items-center gap-4">
          <span class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-app-border bg-app-elevated">
            <img
              v-if="player?.headshotUrl"
              :src="player.headshotUrl"
              :alt="player.displayName"
              class="h-16 w-16 object-cover"
            />
            <span v-else class="text-base font-black text-app-secondary">{{ playerInitials(playerName) }}</span>
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-app-amber">{{ team?.name ?? leagueName }}</p>
            <h1 class="mt-1 truncate text-2xl font-black sm:text-3xl">{{ playerName }}</h1>
            <p class="mt-1 text-sm text-app-secondary">
              {{ [player?.jersey ? `#${player.jersey}` : undefined, player?.position, player?.nationality].filter(Boolean).join(' · ') || 'Cầu thủ' }}
            </p>
          </div>
        </div>
      </header>

      <section class="rounded border border-app-border bg-app-surface p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-bold">Thống kê mùa giải</h2>
            <p class="mt-1 text-xs font-semibold text-app-secondary">{{ stats?.season ?? leagueName }}</p>
          </div>
          <button
            v-if="statsIsError"
            type="button"
            class="rounded border border-app-border px-3 py-2 text-xs font-semibold text-app-secondary transition hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
            @click="handleStatsRefetch"
          >
            Thử lại
          </button>
        </div>

        <div v-if="statsIsLoading" class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div v-for="index in 8" :key="index" class="h-20 animate-pulse rounded border border-app-border bg-app-elevated" />
        </div>

        <StateBlock
          v-else-if="statsIsError || !stats?.groups.length"
          title="Chúng tôi chưa có thống kê mùa cho cầu thủ này."
          message="Một số giải soccer chưa hỗ trợ dữ liệu cầu thủ công khai."
        />

        <div v-else class="mt-4 space-y-4">
          <article v-for="group in stats.groups" :key="group.name" class="space-y-3">
            <h3 class="text-sm font-bold text-app-secondary">{{ group.name }}</h3>
            <dl class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div
                v-for="stat in group.stats"
                :key="stat.key"
                class="rounded border border-app-border bg-app-elevated px-3 py-3"
              >
                <dt class="truncate text-xs font-semibold text-app-secondary">{{ stat.label }}</dt>
                <dd class="mt-1 text-lg font-black text-app-text">{{ formatStatDisplayValue(stat) }}</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getLeagueShortName } from '@/domain/leagues';
import { usePlayerSeasonStats } from '@/composables/usePlayerSeasonStats';
import { useTeamDetail } from '@/composables/useTeamDetail';
import { useTeamRoster } from '@/composables/useTeamRoster';
import { useTeamRouteLeague } from '@/composables/useTeamRouteLeague';
import { formatStatDisplayValue } from '@/domain/stats';
import StateBlock from '@/components/common/StateBlock.vue';

const props = defineProps<{
  leagueSlug: string;
  teamId: string;
  playerId: string;
}>();

const { leagueSlug, teamId, playerId } = toRefs(props);
const route = useRoute();
const router = useRouter();
const {
  effectiveLeague,
  effectiveLeagueSlug,
  canUseLeague: isSupportedLeague,
  shouldRedirect,
  fallbackLeagueSlug
} = useTeamRouteLeague(leagueSlug);
const {
  data: team,
  isLoading: teamIsLoading,
  isError: teamIsError,
  refetch: refetchTeam
} = useTeamDetail(effectiveLeagueSlug, teamId, isSupportedLeague);
const {
  data: roster,
  isLoading: rosterIsLoading
} = useTeamRoster(effectiveLeagueSlug, teamId, isSupportedLeague);
const {
  data: stats,
  isLoading: statsIsLoading,
  isError: statsIsError,
  refetch: refetchStats
} = usePlayerSeasonStats(effectiveLeagueSlug, playerId, isSupportedLeague);
const leagueName = computed(() => {
  const league = effectiveLeague.value;
  return getLeagueShortName(league.slug, league.shortName, league.name);
});
const player = computed(() => roster.value?.find((item) => item.id === props.playerId));
const playerName = computed(() => player.value?.displayName ?? `Cầu thủ ${props.playerId}`);

watch(
  () => [props.leagueSlug, shouldRedirect.value] as const,
  ([, shouldReplace]) => {
    if (!shouldReplace) {
      return;
    }

    void router.replace({
      name: 'player-season-stats',
      params: { leagueSlug: fallbackLeagueSlug.value, teamId: props.teamId, playerId: props.playerId },
      query: route.query
    });
  },
  { immediate: true }
);

function playerInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function handleTeamRefetch(): void {
  void refetchTeam();
}

function handleStatsRefetch(): void {
  void refetchStats();
}
</script>
