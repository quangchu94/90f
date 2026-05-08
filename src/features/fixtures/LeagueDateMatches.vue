<template>
  <section class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-sm font-bold text-app-secondary">{{ dateLabel }}</h3>
      <button
        type="button"
        class="rounded border border-app-border px-3 py-2 text-xs font-semibold text-app-secondary transition hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
        @click="$emit('refetch')"
      >
        Làm mới
      </button>
    </div>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <MatchRow v-for="match in sortedMatches" :key="match.id" :match="match" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FootballMatch } from '@/domain/models';
import { getRelativeDateLabel } from '@/utils/date';
import type { FixtureMode } from '@/stores/fixturesStore';
import MatchRow from '@/components/football/MatchRow.vue';

const props = defineProps<{
  date: string;
  mode: FixtureMode;
  matches: FootballMatch[];
}>();

defineEmits<{
  refetch: [];
}>();

const dateLabel = computed(() => getRelativeDateLabel(props.date));

const sortedMatches = computed(() => {
  return props.mode === 'results'
    ? [...props.matches].sort(sortMatchesNewestFirst)
    : [...props.matches].sort(sortMatchesOldestFirst);
});

function sortMatchesNewestFirst(a: FootballMatch, b: FootballMatch): number {
  return new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime();
}

function sortMatchesOldestFirst(a: FootballMatch, b: FootballMatch): number {
  return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
}
</script>
