<template>
  <section aria-label="Chọn giải đấu">
    <div class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="league in leagues"
        :key="league.slug"
        type="button"
        :class="buttonClass(league.slug)"
        @click="$emit('toggle', league.slug)"
      >
        {{ league.shortName ?? league.name }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { INITIAL_LEAGUES } from '@/domain/leagues';

const props = defineProps<{
  selectedLeagueSlugs: string[];
}>();

defineEmits<{
  toggle: [leagueSlug: string];
}>();

const leagues = INITIAL_LEAGUES;

function buttonClass(leagueSlug: string): string {
  const base =
    'h-9 shrink-0 rounded border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-app-accent';

  return props.selectedLeagueSlugs.includes(leagueSlug)
    ? `${base} border-app-accent bg-app-accent text-white`
    : `${base} border-app-border bg-app-surface text-app-secondary hover:bg-app-elevated hover:text-app-text`;
}
</script>
