<template>
  <RouterLink
    :to="{ name: 'match-detail', params: { leagueSlug: match.leagueSlug, eventId: match.id } }"
    class="grid min-h-24 grid-cols-[3.75rem_1fr_auto] items-center gap-3 rounded border border-app-border bg-app-surface px-3 py-3 transition hover:border-app-accent/60 hover:bg-app-elevated focus:outline-none focus:ring-2 focus:ring-app-accent sm:grid-cols-[5rem_1fr_auto]"
  >
    <div class="text-center">
      <p class="text-sm font-bold text-app-amber">{{ timeLabel }}</p>
      <StatusBadge class="mt-2" :status="match.status" :label="compactStatusLabel" />
    </div>

    <div class="min-w-0 space-y-3">
      <div class="flex min-w-0 items-center gap-2">
        <TeamLogo :src="match.homeTeam.logoUrl" :alt="match.homeTeam.name" :fallback-name="match.homeTeam.shortName" />
        <span class="truncate text-sm font-semibold sm:text-base">{{ match.homeTeam.name }}</span>
      </div>
      <div class="flex min-w-0 items-center gap-2">
        <TeamLogo :src="match.awayTeam.logoUrl" :alt="match.awayTeam.name" :fallback-name="match.awayTeam.shortName" />
        <span class="truncate text-sm font-semibold sm:text-base">{{ match.awayTeam.name }}</span>
      </div>
    </div>

    <div class="grid w-12 gap-3 text-center text-xl font-black text-app-text">
      <span>{{ scoreLabel(match.homeScore) }}</span>
      <span>{{ scoreLabel(match.awayScore) }}</span>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FootballMatch } from '@/domain/models';
import { STATUS_LABELS } from '@/domain/status';
import { formatKickoffTime } from '@/utils/date';
import StatusBadge from './StatusBadge.vue';
import TeamLogo from './TeamLogo.vue';

const props = defineProps<{
  match: FootballMatch;
}>();

const timeLabel = computed(() => {
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
