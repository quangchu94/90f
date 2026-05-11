<template>
  <div class="min-h-screen bg-app-bg text-app-text">
    <header class="sticky top-0 z-30 border-b border-app-border/80 bg-app-bg/95 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <RouterLink to="/fixtures" class="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-app-accent">
          <span class="flex h-9 w-9 items-center justify-center rounded bg-app-accent font-black text-app-text">90</span>
          <span>
            <span class="block text-base font-bold leading-5">90f.com</span>
            <span class="hidden text-xs text-app-secondary sm:block">Lịch thi đấu & kết quả</span>
          </span>
        </RouterLink>

        <nav class="flex flex-wrap items-center justify-end gap-1 text-sm text-app-secondary" aria-label="Điều hướng chính">
          <RouterLink
            to="/fixtures"
            class="rounded px-2 py-2 transition hover:bg-app-surface hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent sm:px-3"
          >
            Kết quả
          </RouterLink>
          <RouterLink
            :to="{ name: 'standings', params: { leagueSlug: defaultLeagueSlug } }"
            class="rounded px-2 py-2 transition hover:bg-app-surface hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent sm:px-3"
          >
            BXH
          </RouterLink>
          <RouterLink
            :to="{ name: 'teams', params: { leagueSlug: defaultLeagueSlug } }"
            class="rounded px-2 py-2 transition hover:bg-app-surface hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent sm:px-3"
          >
            Đội bóng
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DEFAULT_LEAGUE_SLUG, getSupportedLeagueFallback, isSupportedLeagueSlug } from '@/domain/leagues';
import { useFixturesStore } from '@/stores/fixturesStore';

const fixturesStore = useFixturesStore();
const defaultLeagueSlug = computed(() => {
  const selectedLeagueSlug = fixturesStore.selectedLeagueSlug ?? DEFAULT_LEAGUE_SLUG;
  return isSupportedLeagueSlug(selectedLeagueSlug)
    ? selectedLeagueSlug
    : getSupportedLeagueFallback(selectedLeagueSlug);
});
</script>
