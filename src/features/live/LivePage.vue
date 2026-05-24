<template>
  <div class="space-y-5">
    <section class="space-y-2">
      <p class="text-sm font-semibold text-app-live">Livescore</p>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-black tracking-normal sm:text-3xl">Trận đấu đang diễn ra</h1>
          <p class="mt-1 text-sm text-app-secondary">
            Theo dõi tỷ số trực tiếp, tự làm mới khi có trận live.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs text-app-secondary">
          <span class="rounded border border-app-live/50 px-2.5 py-1 font-bold text-app-live">
            {{ liveMatches.length }} live
          </span>
          <span v-if="updatedAtLabel">Cập nhật {{ updatedAtLabel }}</span>
          <button
            type="button"
            class="rounded border border-app-border px-3 py-2 font-semibold transition hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isFetching"
            @click="handleRefetch"
          >
            {{ isFetching ? 'Đang tải' : 'Làm mới' }}
          </button>
        </div>
      </div>
    </section>

    <section class="space-y-3" aria-label="Bộ lọc livescore">
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="filter in filters"
          :key="filter.value"
          type="button"
          class="whitespace-nowrap rounded border px-3 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-app-accent"
          :class="selectedFilter === filter.value
            ? 'border-app-accent bg-app-accent text-white'
            : 'border-app-border bg-app-surface text-app-secondary hover:text-app-text'"
          @click="selectedFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </section>

    <div v-if="isLoading" class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div v-for="item in 4" :key="item" class="h-24 animate-pulse rounded border border-app-border bg-app-surface" />
    </div>

    <StateBlock
      v-else-if="isError && !liveMatches.length"
      title="Không thể tải livescore"
      message="Có thể chúng tôi đang quá tải hoặc proxy tạm thời lỗi. Hãy thử lại sau."
      action-label="Thử lại"
      @action="handleRefetch"
    />

    <section v-else-if="visibleGroups.length" class="space-y-5">
      <p v-if="isError" class="rounded border border-app-danger/40 bg-app-danger/10 px-3 py-2 text-sm text-app-danger">
        Cập nhật mới nhất thất bại, đang hiển thị dữ liệu đã tải trước đó.
      </p>

      <div v-for="group in visibleGroups" :key="group.leagueSlug" class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-bold">{{ group.leagueLabel }}</h2>
            <p class="text-xs text-app-muted">{{ group.matches.length }} trận đang đá</p>
          </div>
          <span class="rounded border border-app-live/40 px-2 py-1 text-xs font-bold text-app-live">Live</span>
        </div>

        <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <MatchRow
            v-for="match in group.matches"
            :key="match.id"
            :match="match"
            show-date
            show-league
          />
        </div>
      </div>
    </section>

    <StateBlock
      v-else
      title="Hiện chưa có trận đang diễn ra"
      message="Livescore sẽ tự cập nhật khi chúng tôi có trận đang đá trong ngày."
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import MatchRow from '@/components/football/MatchRow.vue';
import StateBlock from '@/components/common/StateBlock.vue';
import { getLeagueShortName } from '@/domain/leagues';
import type { FootballMatch } from '@/domain/models';
import { isLiveStatus } from '@/domain/status';
import { useLiveLeagueScoreboards, useLiveScoreboard } from '@/composables/useLiveScoreboard';
import { useFixturesStore } from '@/stores/fixturesStore';
import { getTodayInputDate } from '@/utils/date';

type LiveFilter = 'all' | 'favorites' | string;

const fixturesStore = useFixturesStore();
const selectedDate = ref(getTodayInputDate());
const selectedFilter = ref<LiveFilter>('all');
const updatedAt = ref<Date | null>(null);
const { data, isLoading, isFetching: isBaseFetching, isError: isBaseError, refetch } = useLiveScoreboard(selectedDate);

const favoriteLeagueSlugs = computed(() => new Set(fixturesStore.favoriteLeagues.map((league) => league.slug)));
const unresolvedLiveMatches = computed(() =>
  (data.value ?? []).filter((match) => isLiveStatus(match.status) && match.leagueSlug === 'all')
);
const supplementalLeagueSlugs = computed(() => {
  if (selectedFilter.value === 'all' || !unresolvedLiveMatches.value.length) {
    return [];
  }

  if (selectedFilter.value === 'favorites') {
    return [...favoriteLeagueSlugs.value];
  }

  return [selectedFilter.value];
});
const supplementalScoreboards = useLiveLeagueScoreboards(selectedDate, supplementalLeagueSlugs);
const isFetching = computed(() => isBaseFetching.value || supplementalScoreboards.isFetching.value);
const isError = computed(() => isBaseError.value || supplementalScoreboards.isError.value);
const filters = computed(() => [
  { value: 'all', label: 'Tất cả' },
  { value: 'favorites', label: 'Giải yêu thích' },
  ...fixturesStore.favoriteLeagues.map((league) => ({
    value: league.slug,
    label: getLeagueShortName(league.slug, league.shortName, league.name)
  }))
]);

const liveMatches = computed(() =>
  dedupeMatchesById([...(data.value ?? []), ...supplementalScoreboards.matches.value])
    .filter((match) => isLiveStatus(match.status))
    .sort(sortLiveMatches)
);

const filteredMatches = computed(() => {
  if (selectedFilter.value === 'all') {
    return liveMatches.value;
  }

  if (selectedFilter.value === 'favorites') {
    return liveMatches.value.filter((match) => favoriteLeagueSlugs.value.has(match.leagueSlug));
  }

  return liveMatches.value.filter((match) => match.leagueSlug === selectedFilter.value);
});

const visibleGroups = computed(() => {
  const groups = new Map<string, { leagueSlug: string; leagueLabel: string; matches: FootballMatch[] }>();

  for (const match of filteredMatches.value) {
    const existing = groups.get(match.leagueSlug);
    if (existing) {
      existing.matches.push(match);
      continue;
    }

    groups.set(match.leagueSlug, {
      leagueSlug: match.leagueSlug,
      leagueLabel: match.leagueShortName ?? getLeagueShortName(match.leagueSlug, undefined, match.leagueName),
      matches: [match]
    });
  }

  return [...groups.values()].sort((left, right) => left.leagueLabel.localeCompare(right.leagueLabel));
});

const updatedAtLabel = computed(() => {
  if (!updatedAt.value) {
    return '';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(updatedAt.value);
});

watch(
  () => data.value,
  (matches) => {
    if (matches) {
      updatedAt.value = new Date();
    }
  },
  { immediate: true }
);

function sortLiveMatches(left: FootballMatch, right: FootballMatch): number {
  return left.leagueName.localeCompare(right.leagueName) || left.kickoff.localeCompare(right.kickoff);
}

function dedupeMatchesById(matches: FootballMatch[]): FootballMatch[] {
  const byId = new Map<string, FootballMatch>();

  for (const match of matches) {
    const existing = byId.get(match.id);
    byId.set(match.id, shouldPreferMatch(match, existing) ? match : existing ?? match);
  }

  return [...byId.values()];
}

function shouldPreferMatch(candidate: FootballMatch, existing: FootballMatch | undefined): boolean {
  if (!existing) {
    return true;
  }

  if (existing.leagueSlug === 'all' && candidate.leagueSlug !== 'all') {
    return true;
  }

  if (candidate.leagueSlug === 'all' && existing.leagueSlug !== 'all') {
    return false;
  }

  return matchCompletenessScore(candidate) >= matchCompletenessScore(existing);
}

function matchCompletenessScore(match: FootballMatch): number {
  return [
    match.leagueSlug,
    match.leagueName,
    match.leagueShortName,
    match.kickoff,
    match.homeScore,
    match.awayScore,
    match.homeTeam.logoUrl,
    match.awayTeam.logoUrl,
    match.venue
  ].filter((value) => value !== undefined && value !== '').length;
}

function handleRefetch(): void {
  void refetch();
  supplementalScoreboards.refetchAll();
}
</script>
