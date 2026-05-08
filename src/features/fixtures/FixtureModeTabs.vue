<template>
  <section class="rounded border border-app-border bg-app-surface p-1" aria-label="Chọn chế độ xem">
    <div class="grid grid-cols-2 gap-1">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        :class="buttonClass(tab.value)"
        @click="emit('update:modelValue', tab.value)"
      >
        <span class="block text-sm font-bold">{{ tab.label }}</span>
        <span class="mt-0.5 block text-xs opacity-80">{{ tab.caption }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FixtureMode } from '@/stores/fixturesStore';

const props = defineProps<{
  modelValue: FixtureMode;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: FixtureMode];
}>();

const tabs: Array<{ value: FixtureMode; label: string; caption: string }> = [
  { value: 'results', label: 'Kết quả', caption: 'Đã diễn ra' },
  { value: 'fixtures', label: 'Lịch đấu', caption: 'Sắp diễn ra' }
];

function buttonClass(value: FixtureMode): string {
  const base =
    'min-h-14 rounded px-3 py-2 text-center transition focus:outline-none focus:ring-2 focus:ring-app-accent';

  return props.modelValue === value
    ? `${base} bg-app-accent text-white`
    : `${base} text-app-secondary hover:bg-app-elevated hover:text-app-text`;
}
</script>
