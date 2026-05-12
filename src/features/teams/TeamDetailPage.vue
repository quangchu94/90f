<template>
  <div class="space-y-5">
    <RouterLink
      :to="{ name: 'teams', params: { leagueSlug: effectiveLeagueSlug } }"
      class="inline-flex items-center rounded border border-app-border px-3 py-2 text-sm font-semibold text-app-secondary transition hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
    >
      Quay lại danh sách đội
    </RouterLink>

    <StateBlock
      v-if="!isSupportedLeague"
      title="Giải đấu chưa được hỗ trợ"
      message="Vui lòng chọn một giải đấu khác trong danh sách."
    />

    <div v-else-if="teamIsLoading" class="h-40 animate-pulse rounded border border-app-border bg-app-surface" />

    <StateBlock
      v-else-if="teamIsError || !team"
      title="Không thể tải thông tin đội"
      message="Vui lòng thử lại."
      action-label="Thử lại"
      @action="handleTeamRefetch"
    />

    <section v-else class="space-y-5">
      <header class="rounded border border-app-border bg-app-surface p-4 shadow-soft sm:p-6">
        <div class="flex items-center gap-4">
          <TeamLogo :src="team.logoUrl" :alt="team.name" :fallback-name="team.shortName" class="h-16 w-16" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-app-amber">{{ leagueName }}</p>
            <h1 class="mt-1 truncate text-2xl font-black sm:text-3xl">{{ team.name }}</h1>
            <p class="mt-1 text-sm text-app-secondary">{{ team.abbreviation ?? team.location ?? 'Đội bóng' }}</p>
          </div>
          <FavoriteTeamButton
            :is-favorite="preferences.isFavoriteTeam(effectiveLeagueSlug, team.id)"
            @toggle="preferences.toggleFavoriteTeam(effectiveLeagueSlug, team.id)"
          />
        </div>
      </header>

      <section class="rounded border border-app-border bg-app-surface p-4">
        <h2 class="text-base font-bold">Tổng quan</h2>
        <dl class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div class="flex justify-between gap-3 rounded border border-app-border bg-app-elevated px-3 py-3">
            <dt class="text-app-secondary">Tên ngắn</dt>
            <dd class="text-right font-semibold">{{ team.shortName }}</dd>
          </div>
          <div class="flex justify-between gap-3 rounded border border-app-border bg-app-elevated px-3 py-3">
            <dt class="text-app-secondary">Sân vận động</dt>
            <dd class="text-right font-semibold">{{ teamVenue }}</dd>
          </div>
        </dl>
      </section>

      <section class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-bold">Lịch thi đấu</h2>
          <button
            v-if="scheduleIsError"
            type="button"
            class="rounded border border-app-border px-3 py-2 text-xs font-semibold text-app-secondary transition hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
            @click="handleScheduleRefetch"
          >
            Thử lại
          </button>
        </div>
        <FixtureModeTabs :model-value="activeScheduleTab" @update:model-value="handleScheduleTabChange" />
        <div v-if="scheduleLeagueOptions.length > 1" class="flex justify-end">
          <label class="flex items-center gap-2 text-xs font-semibold text-app-secondary">
            Giải đấu
            <select
              v-model="activeScheduleLeague"
              class="rounded border border-app-border bg-app-surface px-3 py-2 text-sm font-semibold text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
            >
              <option value="all">Tất cả</option>
              <option
                v-for="league in scheduleLeagueOptions"
                :key="league.slug"
                :value="league.slug"
              >
                {{ league.shortName }}
              </option>
            </select>
          </label>
        </div>
        <div v-if="scheduleIsLoading" class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div v-for="index in 4" :key="index" class="h-24 animate-pulse rounded border border-app-border bg-app-surface" />
        </div>
        <StateBlock
          v-else-if="scheduleIsError"
          title="Không thể tải lịch thi đấu"
          message="Vui lòng thử lại sau."
        />
        <StateBlock
          v-else-if="!visibleSchedule.length && scheduleIsFetching"
          title="Đang tải dữ liệu"
          message="Lịch thi đấu của đội đang được cập nhật."
        />
        <StateBlock
          v-else-if="!visibleSchedule.length"
          title="Chưa có lịch thi đấu cho đội này."
          message="ESPN chưa trả dữ liệu lịch thi đấu."
        />
        <div v-else class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <MatchRow v-for="match in visibleSchedule" :key="match.id" :match="match" show-date show-league />
        </div>
      </section>

      <section class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-bold">Đội hình</h2>
          <button
            v-if="rosterIsError"
            type="button"
            class="rounded border border-app-border px-3 py-2 text-xs font-semibold text-app-secondary transition hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
            @click="handleRosterRefetch"
          >
            Thử lại
          </button>
        </div>
        <div v-if="rosterIsLoading" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="index in 9" :key="index" class="h-20 animate-pulse rounded border border-app-border bg-app-surface" />
        </div>
        <StateBlock
          v-else-if="rosterIsError"
          title="Không thể tải đội hình"
          message="Vui lòng thử lại sau."
        />
        <StateBlock
          v-else-if="!roster?.length"
          title="Chưa có dữ liệu đội hình."
          message="ESPN chưa trả roster cho đội này."
        />
        <div v-else class="space-y-4">
          <article v-for="group in rosterGroups" :key="group.position" class="space-y-3">
            <h3 class="text-sm font-bold text-app-secondary">{{ group.position }}</h3>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="player in group.players"
                :key="player.id"
                class="flex min-h-20 items-center gap-3 rounded border border-app-border bg-app-surface p-3"
              >
                <span class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-app-border bg-app-elevated">
                  <img
                    v-if="player.headshotUrl"
                    :src="player.headshotUrl"
                    :alt="player.displayName"
                    class="h-10 w-10 object-cover"
                    loading="lazy"
                  />
                  <span v-else class="text-xs font-bold text-app-secondary">{{ playerInitials(player.displayName) }}</span>
                </span>
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold">{{ player.displayName }}</p>
                  <p class="truncate text-xs text-app-secondary">
                    {{ [player.jersey ? `#${player.jersey}` : undefined, player.nationality].filter(Boolean).join(' · ') || 'Cầu thủ' }}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRefs, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  getLeagueShortName
} from '@/domain/leagues';
import type { PlayerSummary } from '@/domain/models';
import { isResultStatus, isUpcomingStatus } from '@/domain/status';
import { useTeamDetail } from '@/composables/useTeamDetail';
import { useTeamRouteLeague } from '@/composables/useTeamRouteLeague';
import { useTeamRoster } from '@/composables/useTeamRoster';
import { useTeamSchedule } from '@/composables/useTeamSchedule';
import { usePreferencesStore } from '@/stores/preferencesStore';
import type { FixtureMode } from '@/stores/fixturesStore';
import MatchRow from '@/components/football/MatchRow.vue';
import FavoriteTeamButton from '@/components/football/FavoriteTeamButton.vue';
import TeamLogo from '@/components/football/TeamLogo.vue';
import StateBlock from '@/components/common/StateBlock.vue';
import FixtureModeTabs from '@/features/fixtures/FixtureModeTabs.vue';

const props = defineProps<{
  leagueSlug: string;
  teamId: string;
}>();

const { leagueSlug, teamId } = toRefs(props);
const route = useRoute();
const router = useRouter();
const preferences = usePreferencesStore();
const activeScheduleTab = ref<FixtureMode>(parseScheduleTab(route.query.tab));
const activeScheduleLeague = ref(parseScheduleLeague(route.query.league));
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
  isLoading: rosterIsLoading,
  isError: rosterIsError,
  refetch: refetchRoster
} = useTeamRoster(effectiveLeagueSlug, teamId, isSupportedLeague);
const {
  data: schedule,
  isLoading: scheduleIsLoading,
  isFetching: scheduleIsFetching,
  isError: scheduleIsError,
  refetch: refetchSchedule
} = useTeamSchedule(effectiveLeagueSlug, teamId, isSupportedLeague);
const leagueName = computed(() => {
  const league = effectiveLeague.value;
  return getLeagueShortName(league.slug, league.shortName, league.name);
});
const teamVenue = computed(() => team.value?.venue ?? inferredHomeVenue.value ?? 'Chưa có dữ liệu');
const rosterGroups = computed(() => groupRoster(roster.value ?? []));
const inferredHomeVenue = computed(() => {
  if (!team.value) {
    return undefined;
  }

  return (schedule.value ?? [])
    .filter(
      (match) =>
        match.homeTeam.id === team.value?.id &&
        match.neutralSite !== true &&
        Boolean(match.venue)
    )
    .sort((left, right) => getKickoffDistance(left.kickoff) - getKickoffDistance(right.kickoff))[0]
    ?.venue;
});
const scheduleLeagueOptions = computed(() => {
  const leagues = new Map<string, string>();

  for (const match of schedule.value ?? []) {
    leagues.set(match.leagueSlug, match.leagueName);
  }

  return [...leagues.entries()]
    .map(([slug, name]) => ({ slug, name, shortName: getLeagueShortName(slug, undefined, name) }))
    .sort((left, right) => left.name.localeCompare(right.name));
});
const visibleSchedule = computed(() => {
  const selectedLeagueExists = scheduleLeagueOptions.value.some(
    (league) => league.slug === activeScheduleLeague.value
  );
  const selectedLeague = selectedLeagueExists ? activeScheduleLeague.value : 'all';

  return (schedule.value ?? [])
    .filter((match) =>
      activeScheduleTab.value === 'results' ? isResultStatus(match.status) : isUpcomingStatus(match.status)
    )
    .filter((match) => selectedLeague === 'all' || match.leagueSlug === selectedLeague)
    .sort((left, right) =>
      activeScheduleTab.value === 'results'
        ? new Date(right.kickoff).getTime() - new Date(left.kickoff).getTime()
        : new Date(left.kickoff).getTime() - new Date(right.kickoff).getTime()
    );
});

watch(
  () => [props.leagueSlug, shouldRedirect.value] as const,
  ([, shouldReplace]) => {
    if (shouldReplace) {
      void router.replace({
        name: 'team-detail',
        params: { leagueSlug: fallbackLeagueSlug.value, teamId: props.teamId },
        query: route.query
      });
    }
  },
  { immediate: true }
);

watch(
  () => [route.query.tab, route.query.league],
  ([tab, league]) => {
    activeScheduleTab.value = parseScheduleTab(tab);
    activeScheduleLeague.value = parseScheduleLeague(league);
  }
);

watch([activeScheduleTab, activeScheduleLeague], ([tab, league]) => {
  const nextQuery = { ...route.query };

  if (tab === 'fixtures') {
    delete nextQuery.tab;
  } else {
    nextQuery.tab = tab;
  }

  if (league === 'all') {
    delete nextQuery.league;
  } else {
    nextQuery.league = league;
  }

  if (nextQuery.tab === route.query.tab && nextQuery.league === route.query.league) {
    return;
  }

  void router.replace({ query: nextQuery });
});

function groupRoster(players: PlayerSummary[]): Array<{ position: string; players: PlayerSummary[] }> {
  const groupedPlayers = new Map<string, PlayerSummary[]>();

  for (const player of players) {
    const position = player.position ?? 'Khác';
    groupedPlayers.set(position, [...(groupedPlayers.get(position) ?? []), player]);
  }

  return [...groupedPlayers.entries()].map(([position, groupPlayers]) => ({
    position,
    players: groupPlayers
  }));
}

function playerInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getKickoffDistance(kickoff: string): number {
  const timestamp = new Date(kickoff).getTime();
  return Number.isFinite(timestamp) ? Math.abs(timestamp - Date.now()) : Number.MAX_SAFE_INTEGER;
}

function handleTeamRefetch(): void {
  void refetchTeam();
}

function handleRosterRefetch(): void {
  void refetchRoster();
}

function handleScheduleRefetch(): void {
  void refetchSchedule();
}

function handleScheduleTabChange(tab: FixtureMode): void {
  activeScheduleTab.value = tab;
}

function parseScheduleTab(value: unknown): FixtureMode {
  return value === 'results' || value === 'fixtures' ? value : 'fixtures';
}

function parseScheduleLeague(value: unknown): string {
  return typeof value === 'string' && value ? value : 'all';
}
</script>
