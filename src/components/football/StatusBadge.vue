<template>
  <span :class="badgeClass">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MatchStatus } from '@/domain/models';
import { STATUS_LABELS } from '@/domain/status';

const props = defineProps<{
  status: MatchStatus;
  label?: string;
}>();

const label = computed(() => props.label ?? STATUS_LABELS[props.status]);

const badgeClass = computed(() => {
  const base = 'inline-flex h-6 items-center justify-center rounded border px-2 text-[0.7rem] font-semibold sm:min-w-20 sm:text-xs';

  if (props.status === 'in_progress' || props.status === 'halftime') {
    return `${base} border-app-live/50 bg-app-live/15 text-app-live`;
  }

  if (props.status === 'finished') {
    return `${base} border-app-border bg-app-elevated text-app-secondary`;
  }

  if (props.status === 'postponed' || props.status === 'cancelled') {
    return `${base} border-app-danger/50 bg-app-danger/10 text-app-danger`;
  }

  return `${base} border-app-amber/40 bg-app-amber/10 text-app-amber`;
});
</script>
