<template>
  <span class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-app-border bg-app-elevated">
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      class="h-6 w-6 object-contain"
      loading="lazy"
    />
    <span v-else class="text-xs font-bold text-app-secondary">{{ fallback }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  src?: string;
  alt: string;
  fallbackName: string;
}>();

const fallback = computed(() => props.fallbackName.slice(0, 2).toUpperCase());
</script>
