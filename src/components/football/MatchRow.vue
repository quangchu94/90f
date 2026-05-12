<template>
  <RouterLink
    :to="matchDetailRoute"
    class="grid min-h-24 grid-cols-[minmax(0,1fr)_2.25rem] gap-2 rounded border border-app-border bg-app-surface px-3 py-3 transition hover:border-app-accent/60 hover:bg-app-elevated focus:outline-none focus:ring-2 focus:ring-app-accent sm:grid-cols-[5rem_minmax(0,1fr)_3rem] sm:items-center sm:gap-3"
  >
    <div class="col-span-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-left sm:col-span-1 sm:block sm:text-center">
      <p v-if="showLeague" class="line-clamp-2 text-[0.65rem] font-semibold leading-tight text-app-secondary">{{ leagueLabel }}</p>
      <p v-if="match.importanceLabel" class="inline-flex rounded border border-app-amber/50 px-1.5 py-0.5 text-[0.65rem] font-bold text-app-amber sm:mt-1">
        {{ match.importanceLabel }}
      </p>
      <p v-if="showDate" class="text-xs font-semibold text-app-secondary">{{ dateLabel }}</p>
      <p class="text-sm font-bold text-app-amber">{{ timeLabel }}</p>
      <StatusBadge class="sm:mt-2" :status="match.status" :label="compactStatusLabel" />
    </div>

    <div class="min-w-0 space-y-2 sm:space-y-3">
      <div class="flex min-w-0 items-center gap-2">
        <TeamLogo :src="match.homeTeam.logoUrl" :alt="match.homeTeam.name" :fallback-name="match.homeTeam.shortName" />
        <span class="truncate text-sm font-semibold sm:text-base">{{ match.homeTeam.name }}</span>
      </div>
      <div class="flex min-w-0 items-center gap-2">
        <TeamLogo :src="match.awayTeam.logoUrl" :alt="match.awayTeam.name" :fallback-name="match.awayTeam.shortName" />
        <span class="truncate text-sm font-semibold sm:text-base">{{ match.awayTeam.name }}</span>
      </div>
    </div>

    <div class="grid w-9 gap-2 text-center text-lg font-black text-app-text sm:w-12 sm:gap-3 sm:text-xl">
      <span>{{ scoreLabel(match.homeScore) }}</span>
      <span>{{ scoreLabel(match.awayScore) }}</span>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { FootballMatch } from '@/domain/models';
import { getLeagueShortName } from '@/domain/leagues';
import { STATUS_LABELS } from '@/domain/status';
import { formatKickoffDate, formatKickoffTime } from '@/utils/date';
import StatusBadge from './StatusBadge.vue';
import TeamLogo from './TeamLogo.vue';

const props = withDefaults(defineProps<{
  match: FootballMatch;
  showDate?: boolean;
  showLeague?: boolean;
}>(), {
  showDate: false,
  showLeague: false
});
const route = useRoute();

const matchDetailRoute = computed(() => ({
  name: 'match-detail',
  params: { leagueSlug: props.match.leagueSlug, eventId: props.match.id },
  query: route?.fullPath ? { returnTo: route.fullPath } : undefined
}));

const dateLabel = computed(() => formatKickoffDate(props.match.kickoff));
const leagueLabel = computed(() =>
  props.match.leagueShortName ?? getLeagueShortName(props.match.leagueSlug, undefined, props.match.leagueName)
);

const timeLabel = computed(() => {
  if (props.match.status === 'in_progress' || props.match.status === 'halftime') {
    return props.match.statusText;
  }

  if (props.match.status === 'finished') {
    return 'FT';
  }

  return formatKickoffTime(props.match.kickoff);
});

const compactStatusLabel = computed(() => {
  if (props.match.status === 'in_progress') {
    return 'Live';
  }

  return STATUS_LABELS[props.match.status];
});

function scoreLabel(score: number | undefined): string {
  return score === undefined ? '-' : `${score}`;
}
</script>
