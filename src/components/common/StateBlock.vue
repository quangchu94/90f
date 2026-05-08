<template>
  <div class="rounded border border-app-border bg-app-surface px-4 py-6 text-center">
    <p class="text-sm font-semibold text-app-text">{{ title }}</p>
    <p v-if="message" class="mt-1 text-sm text-app-secondary">{{ message }}</p>
    <button
      v-if="actionLabel"
      type="button"
      class="mt-4 rounded bg-app-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 focus:ring-offset-app-bg"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  message?: string;
  actionLabel?: string;
}>();

defineEmits<{
  action: [];
}>();
</script>
