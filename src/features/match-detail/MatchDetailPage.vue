<template>
  <div class="space-y-5">
    <RouterLink
      :to="backTarget"
      class="inline-flex items-center rounded border border-app-border px-3 py-2 text-sm font-semibold text-app-secondary transition hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
    >
      Quay lại lịch thi đấu
    </RouterLink>

    <div v-if="isLoading" class="h-72 animate-pulse rounded border border-app-border bg-app-surface" />

    <StateBlock
      v-else-if="isError || !match"
      title="Không thể tải chi tiết trận"
      message="Vui lòng thử lại sau ít phút."
      action-label="Thử lại"
      @action="handleRefetch"
    />

    <section v-else class="space-y-5">
      <div class="rounded border border-app-border bg-app-surface p-4 shadow-soft sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-app-amber">{{ leagueLabel }}</p>
            <h1 class="mt-1 text-xl font-black sm:text-2xl">{{ match.homeTeam.name }} vs {{ match.awayTeam.name }}</h1>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <span
              v-if="match.importanceLabel"
              class="inline-flex h-6 items-center rounded border border-app-amber/50 px-2 text-xs font-bold text-app-amber"
            >
              {{ match.importanceLabel }}
            </span>
            <StatusBadge :status="match.status" :label="match.statusText" />
          </div>
        </div>

        <div class="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <RouterLink
            :to="homeTeamRoute"
            :aria-label="`Xem lịch đấu và kết quả của ${match.homeTeam.name}`"
            class="block min-w-0 rounded text-center transition hover:text-app-amber focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 focus:ring-offset-app-surface"
            data-testid="home-team-link"
          >
            <TeamLogo :src="match.homeTeam.logoUrl" :alt="match.homeTeam.name" :fallback-name="match.homeTeam.shortName" class="mx-auto h-14 w-14" />
            <p class="mt-3 truncate text-sm font-bold sm:text-base">{{ match.homeTeam.name }}</p>
          </RouterLink>

          <div class="rounded border border-app-border bg-app-elevated px-4 py-3 text-center">
            <p class="text-3xl font-black">{{ scoreLabel(match.homeScore) }} - {{ scoreLabel(match.awayScore) }}</p>
            <p v-if="match.penaltyShootout" class="mt-1 text-xs font-bold text-app-secondary">
              Pen: {{ match.penaltyShootout.home }} - {{ match.penaltyShootout.away }}
            </p>
            <p class="mt-1 text-xs font-semibold text-app-amber">{{ timeLabel }}</p>
          </div>

          <RouterLink
            :to="awayTeamRoute"
            :aria-label="`Xem lịch đấu và kết quả của ${match.awayTeam.name}`"
            class="block min-w-0 rounded text-center transition hover:text-app-amber focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 focus:ring-offset-app-surface"
            data-testid="away-team-link"
          >
            <TeamLogo :src="match.awayTeam.logoUrl" :alt="match.awayTeam.name" :fallback-name="match.awayTeam.shortName" class="mx-auto h-14 w-14" />
            <p class="mt-3 truncate text-sm font-bold sm:text-base">{{ match.awayTeam.name }}</p>
          </RouterLink>
        </div>
      </div>

      <section class="flex rounded border border-app-border bg-app-surface p-1" aria-label="Match detail tabs">
        <button
          v-for="tab in detailTabs"
          :key="tab.value"
          type="button"
          :class="detailTabClass(tab.value)"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </section>

      <div v-if="activeTab === 'overview'" class="grid gap-3 sm:grid-cols-2">
        <section class="rounded border border-app-border bg-app-surface p-4">
          <h2 class="text-base font-bold">Thông tin trận</h2>
          <dl class="mt-3 space-y-3 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-app-secondary">Thời gian</dt>
              <dd class="text-right font-semibold">{{ timeLabel }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-app-secondary">Sân vận động</dt>
              <dd class="text-right font-semibold">{{ match.venue ?? 'Chưa có dữ liệu' }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-app-secondary">Khán giả</dt>
              <dd class="text-right font-semibold">{{ attendanceLabel }}</dd>
            </div>
          </dl>
        </section>

        <section class="rounded border border-app-border bg-app-surface p-4">
          <h2 class="text-base font-bold">Phát sóng</h2>
          <p class="mt-3 text-sm text-app-secondary">{{ broadcastLabel }}</p>
        </section>
      </div>

      <section v-else-if="activeTab === 'timeline'" class="rounded border border-app-border bg-app-surface p-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-bold">Diễn biến chính</h2>
          <span class="text-xs font-semibold text-app-muted">
            {{ match.goals.length }} bàn thắng · {{ match.redCards.length }} thẻ đỏ
          </span>
        </div>

        <div v-if="match.events.length" class="mt-4 space-y-2">
          <article
            v-for="event in match.events"
            :key="event.id"
            class="grid grid-cols-[1fr_5.75rem_1fr] items-center gap-3 rounded border border-app-border bg-app-elevated px-3 py-3"
            data-testid="timeline-event"
          >
            <div class="min-w-0 text-left" data-testid="home-event">
              <div v-if="eventSide(event) === 'home' || eventSide(event) === 'unknown'" class="min-w-0">
                <p class="truncate text-sm font-semibold">{{ eventPlayerLabel(event) }}</p>
                <p class="truncate text-xs text-app-secondary">{{ event.teamName ?? event.text }}</p>
              </div>
            </div>

            <div class="text-center">
              <p class="text-sm font-black text-app-amber">{{ event.displayMinute || '-' }}</p>
              <span :class="eventBadgeClass(event.type)" data-testid="event-badge">
                {{ event.type === 'goal' ? 'Bàn thắng' : 'Thẻ đỏ' }}
              </span>
            </div>

            <div class="min-w-0 text-right" data-testid="away-event">
              <div v-if="eventSide(event) === 'away'" class="min-w-0">
                <p class="truncate text-sm font-semibold">{{ eventPlayerLabel(event) }}</p>
                <p class="truncate text-xs text-app-secondary">{{ event.teamName ?? event.text }}</p>
              </div>
            </div>
          </article>
        </div>

        <p v-else class="mt-3 text-sm text-app-secondary">Chưa có sự kiện trận đấu.</p>
      </section>

      <section v-else-if="activeTab === 'team-stats'" class="rounded border border-app-border bg-app-surface p-4">
        <h2 class="text-base font-bold">Thống kê đội</h2>
        <div v-if="teamStatRows.length" class="mt-4 space-y-3" data-testid="team-match-stats">
          <div class="grid grid-cols-[minmax(0,1fr)_minmax(8rem,11rem)_minmax(0,1fr)] gap-3 text-xs font-bold text-app-secondary sm:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)_minmax(0,1fr)]">
            <span class="truncate">{{ match.homeTeam.shortName }}</span>
            <span class="text-center">Chỉ số</span>
            <span class="truncate text-right">{{ match.awayTeam.shortName }}</span>
          </div>
          <div
            v-for="row in teamStatRows"
            :key="row.key"
            class="grid grid-cols-[minmax(0,1fr)_minmax(8rem,11rem)_minmax(0,1fr)] items-center gap-3 rounded border border-app-border bg-app-elevated px-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)_minmax(0,1fr)]"
          >
            <span class="font-black">{{ row.home }}</span>
            <span class="break-words text-center text-xs font-semibold leading-snug text-app-secondary">{{ row.label }}</span>
            <span class="text-right font-black">{{ row.away }}</span>
          </div>
        </div>
        <p v-else class="mt-3 text-sm text-app-secondary">Chúng tôi chưa có thống kê đội cho trận này.</p>
      </section>

      <section v-else class="rounded border border-app-border bg-app-surface p-4">
        <h2 class="text-base font-bold">{{ playerStatsTitle }}</h2>
        <div v-if="match.playerStats.length" class="mt-4 space-y-4" data-testid="player-match-stats">
          <article v-for="group in match.playerStats" :key="`${group.team.id}-${group.category}`" class="space-y-2">
            <div class="flex items-center justify-between gap-3">
              <h3 class="truncate text-sm font-bold text-app-secondary">{{ group.team.shortName }} · {{ group.category }}</h3>
              <span class="text-xs font-semibold text-app-muted">{{ group.players.length }} cầu thủ</span>
            </div>
            <div class="overflow-x-auto rounded border border-app-border">
              <table class="min-w-full divide-y divide-app-border text-sm">
                <thead class="bg-app-elevated text-xs text-app-secondary">
                  <tr>
                    <th class="px-3 py-2 text-left">Cầu thủ</th>
                    <th v-for="label in compactPlayerLabels(group.labels)" :key="label" class="min-w-24 whitespace-normal px-3 py-2 text-right leading-snug">
                      {{ label }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-app-border">
                  <tr v-for="row in group.players" :key="row.player.id">
                    <td class="max-w-40 truncate px-3 py-2 font-semibold">{{ row.player.displayName }}</td>
                    <td
                      v-for="stat in compactPlayerStats(row.stats)"
                      :key="stat.key"
                      class="px-3 py-2 text-right font-bold"
                    >
                      {{ formatStatDisplayValue(stat) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </div>
        <p v-else class="mt-3 text-sm text-app-secondary">Chúng tôi chưa có thống kê cầu thủ cho trận này.</p>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRefs, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { MatchEvent, MatchEventType, PlayerMatchStatGroup, StatSummary } from '@/domain/models';
import { getLeagueShortName } from '@/domain/leagues';
import { formatStatDisplayValue } from '@/domain/stats';
import { useMatchSummary } from '@/composables/useMatchSummary';
import { formatKickoffDateTime } from '@/utils/date';
import StatusBadge from '@/components/football/StatusBadge.vue';
import TeamLogo from '@/components/football/TeamLogo.vue';
import StateBlock from '@/components/common/StateBlock.vue';

const props = defineProps<{
  leagueSlug: string;
  eventId: string;
}>();

type DetailTab = 'overview' | 'timeline' | 'team-stats' | 'player-stats';

const { leagueSlug, eventId } = toRefs(props);
const route = useRoute();
const router = useRouter();
const { data: match, isLoading, isError, refetch } = useMatchSummary(leagueSlug, eventId);
const backTarget = computed(() => getSafeReturnTo(route.query.returnTo));
const activeTab = ref<DetailTab>('timeline');
const detailTabs: Array<{ value: DetailTab; label: string }> = [
  { value: 'timeline', label: 'Diễn biến' },
  { value: 'team-stats', label: 'Thống kê' },
  { value: 'player-stats', label: 'Cầu thủ' },
  { value: 'overview', label: 'Thông tin Khác' }
];

const timeLabel = computed(() => {
  if (!match.value?.kickoff) {
    return 'TBD';
  }

  return formatKickoffDateTime(match.value.kickoff);
});

const attendanceLabel = computed(() =>
  match.value?.attendance ? new Intl.NumberFormat('vi-VN').format(match.value.attendance) : 'Chưa có dữ liệu'
);

const broadcastLabel = computed(() =>
  match.value?.broadcasts.length ? match.value.broadcasts.join(', ') : 'Chưa có dữ liệu'
);
const leagueLabel = computed(() =>
  match.value
    ? getMatchLeagueLabel(match.value.leagueSlug, match.value.leagueName, match.value.leagueShortName)
    : ''
);
const homeTeamRoute = computed(() => ({
  name: 'team-detail',
  params: {
    leagueSlug: match.value?.leagueSlug ?? props.leagueSlug,
    teamId: match.value?.homeTeam.id ?? ''
  }
}));
const awayTeamRoute = computed(() => ({
  name: 'team-detail',
  params: {
    leagueSlug: match.value?.leagueSlug ?? props.leagueSlug,
    teamId: match.value?.awayTeam.id ?? ''
  }
}));
const teamStatRows = computed(() => {
  const stats = match.value?.teamStats ?? [];
  const home = stats.find((entry) => entry.team.id === match.value?.homeTeam.id) ?? stats[0];
  const away = stats.find((entry) => entry.team.id === match.value?.awayTeam.id) ?? stats[1];

  if (!home || !away) {
    return [];
  }

  const awayByKey = new Map(away.stats.map((stat) => [stat.key, stat]));
  return home.stats.flatMap((homeStat) => {
    const awayStat = awayByKey.get(homeStat.key);
    return awayStat
      ? [{
          key: homeStat.key,
          label: homeStat.label,
          home: formatStatDisplayValue(homeStat),
          away: formatStatDisplayValue(awayStat)
        }]
      : [];
  });
});
const playerStatsTitle = computed(() =>
  match.value?.playerStats.some((group) => group.source === 'leaders')
    ? 'Cầu thủ nổi bật'
    : 'Thống kê cầu thủ theo trận'
);

watch(
  () => match.value?.leagueSlug,
  (canonicalLeagueSlug) => {
    if (!canonicalLeagueSlug || canonicalLeagueSlug === props.leagueSlug || isLoading.value || isError.value) {
      return;
    }

    void router.replace({
      name: 'match-detail',
      params: { leagueSlug: canonicalLeagueSlug, eventId: props.eventId },
      query: route.query
    });
  },
  { immediate: true }
);

function scoreLabel(score: number | undefined): string {
  return score === undefined ? '-' : `${score}`;
}

function eventBadgeClass(type: MatchEventType): string {
  const base = 'mt-1 inline-flex rounded border px-2 py-1 text-xs font-semibold';

  return type === 'goal'
    ? `${base} border-app-live/50 bg-app-live/10 text-app-live`
    : `${base} border-app-danger/50 bg-app-danger/10 text-app-danger`;
}

function eventSide(event: MatchEvent): 'home' | 'away' | 'unknown' {
  if (event.teamId && event.teamId === match.value?.homeTeam.id) {
    return 'home';
  }

  if (event.teamId && event.teamId === match.value?.awayTeam.id) {
    return 'away';
  }

  return 'unknown';
}

function eventPlayerLabel(event: MatchEvent): string {
  if (event.goalQualifier === 'penalty') {
    return `${event.playerName} (P)`;
  }

  if (event.goalQualifier === 'free_kick') {
    return `${event.playerName} (F)`;
  }

  return event.playerName;
}

function detailTabClass(tab: DetailTab): string {
  const base = 'h-10 flex-1 rounded px-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-app-accent';
  return tab === activeTab.value
    ? `${base} bg-app-accent text-white`
    : `${base} text-app-secondary hover:text-app-text`;
}

function compactPlayerLabels(labels: PlayerMatchStatGroup['labels']): string[] {
  return labels.slice(0, 6);
}

function compactPlayerStats(stats: StatSummary[]): StatSummary[] {
  return stats.slice(0, 6);
}

function getMatchLeagueLabel(slug: string, leagueName: string, leagueShortName?: string): string {
  if (isClearLeagueName(leagueName, slug)) {
    return leagueName;
  }

  if (isClearLeagueName(leagueShortName, slug)) {
    return leagueShortName;
  }

  return getLeagueShortName(slug, undefined, leagueName);
}

function isClearLeagueName(leagueName: string | undefined, slug: string): leagueName is string {
  if (!leagueName || leagueName === slug) {
    return false;
  }

  return !/^[A-Z]{2,4}\s+\d+$/.test(leagueName.trim());
}

function handleRefetch(): void {
  void refetch();
}

function getSafeReturnTo(returnTo: unknown): string {
  if (typeof returnTo !== 'string') {
    return '/fixtures';
  }

  return returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/fixtures';
}
</script>
