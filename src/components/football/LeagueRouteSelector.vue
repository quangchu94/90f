<template>
  <label class="flex flex-col gap-2 text-sm font-semibold text-app-secondary">
    <span>Giải đấu</span>
    <select
      class="h-10 rounded border border-app-border bg-app-surface px-3 text-sm font-semibold text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
      :value="modelValue"
      @change="handleChange"
    >
      <option v-for="league in selectorLeagues" :key="league.slug" :value="league.slug">
        {{ getLeagueShortName(league.slug, league.shortName, league.name) }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getLeagueBySlug, getLeagueShortName, INITIAL_LEAGUES, mergeLeagueSummaries } from '@/domain/leagues';
import type { LeagueSummary } from '@/domain/models';

const props = withDefaults(defineProps<{
  modelValue: string;
  leagues?: LeagueSummary[];
}>(), {
  leagues: () => INITIAL_LEAGUES
});

const emit = defineEmits<{
  'update:modelValue': [leagueSlug: string];
}>();

const selectorLeagues = computed(() => {
  if (props.leagues.some((league) => league.slug === props.modelValue)) {
    return props.leagues;
  }

  return mergeLeagueSummaries([getLeagueBySlug(props.modelValue), ...props.leagues]);
});

function handleChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLSelectElement).value);
}
</script>
