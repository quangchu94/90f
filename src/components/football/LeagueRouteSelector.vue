<template>
  <label class="flex flex-col gap-2 text-sm font-semibold text-app-secondary">
    <span>Giải đấu</span>
    <select
      class="h-10 rounded border border-app-border bg-app-surface px-3 text-sm font-semibold text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
      :value="modelValue"
      @change="handleChange"
    >
      <option v-for="league in leagues" :key="league.slug" :value="league.slug">
        {{ league.shortName ?? league.name }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
import { INITIAL_LEAGUES } from '@/domain/leagues';

defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [leagueSlug: string];
}>();

const leagues = INITIAL_LEAGUES;

function handleChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLSelectElement).value);
}
</script>
