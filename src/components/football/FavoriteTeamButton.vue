<template>
  <button
    type="button"
    :class="buttonClass"
    :aria-pressed="isFavorite"
    :aria-label="isFavorite ? 'Bỏ đội yêu thích' : 'Thêm đội yêu thích'"
    @click.stop.prevent="$emit('toggle')"
  >
    <span aria-hidden="true">{{ isFavorite ? '★' : '☆' }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  isFavorite: boolean;
}>();

defineEmits<{
  toggle: [];
}>();

const buttonClass = computed(() => {
  const base =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded border text-lg font-black transition focus:outline-none focus:ring-2 focus:ring-app-accent';

  return props.isFavorite
    ? `${base} border-app-amber bg-app-amber/15 text-app-amber`
    : `${base} border-app-border bg-app-elevated text-app-muted hover:text-app-amber`;
});
</script>
