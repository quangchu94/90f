<template>
  <section class="rounded border border-app-border bg-app-surface p-3">
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="option in quickOptions"
        :key="option.date"
        type="button"
        :class="buttonClass(option.date)"
        @click="emit('update:modelValue', option.date)"
      >
        {{ option.label }}
      </button>
    </div>

    <label class="mt-3 block">
      <span class="sr-only">Chọn ngày</span>
      <input
        type="date"
        :value="modelValue"
        class="h-11 w-full rounded border border-app-border bg-app-elevated px-3 text-sm text-app-text [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-app-accent"
        @input="handleInput"
      />
    </label>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { addDays, getRelativeDateLabel, getTodayInputDate } from '@/utils/date';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const today = getTodayInputDate();

const quickOptions = computed(() => [
  { label: 'Hôm qua', date: addDays(today, -1) },
  { label: getRelativeDateLabel(today), date: today },
  { label: 'Ngày mai', date: addDays(today, 1) }
]);

function buttonClass(date: string): string {
  const base =
    'h-10 rounded border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-app-accent';

  return props.modelValue === date
    ? `${base} border-app-accent bg-app-accent text-white`
    : `${base} border-app-border bg-app-elevated text-app-secondary hover:text-app-text`;
}

function handleInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
}
</script>
