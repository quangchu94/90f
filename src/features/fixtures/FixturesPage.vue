<template>
  <div class="space-y-5">
    <section class="space-y-2">
      <p class="text-sm font-semibold text-app-amber">Scores & Fixtures</p>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-black tracking-normal sm:text-3xl">Lịch thi đấu bóng đá</h1>
          <p class="mt-1 text-sm text-app-secondary">
            Xem kết quả đã diễn ra và lịch đấu sắp tới.
          </p>
        </div>
      </div>
    </section>

    <FixtureModeTabs :model-value="store.activeTab" @update:model-value="store.setActiveTab" />
    <LeagueFilter :selected-league-slugs="store.selectedLeagueSlugs" @toggle="store.toggleLeague" />

    <div class="space-y-6">
      <LeagueMatchGroup
        v-for="leagueSlug in store.selectedLeagueSlugs"
        :key="leagueSlug"
        :league-slug="leagueSlug"
        :dates="activeDates"
        :mode="store.activeTab"
      />
    </div>

    <div class="flex justify-center">
      <button
        type="button"
        class="rounded border border-app-accent bg-app-accent px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 focus:ring-offset-app-bg"
        @click="handleLoadMore"
      >
        {{ loadMoreLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFixturesStore } from '@/stores/fixturesStore';
import { getFixtureDateRange, getResultDateRange } from '@/utils/date';
import FixtureModeTabs from './FixtureModeTabs.vue';
import LeagueFilter from './LeagueFilter.vue';
import LeagueMatchGroup from './LeagueMatchGroup.vue';

const store = useFixturesStore();

const activeDates = computed(() =>
  store.activeTab === 'results'
    ? getResultDateRange(store.resultDayCount)
    : getFixtureDateRange(store.fixtureDayCount)
);

const loadMoreLabel = computed(() =>
  store.activeTab === 'results' ? 'Tải thêm kết quả' : 'Tải thêm lịch đấu'
);

function handleLoadMore(): void {
  if (store.activeTab === 'results') {
    store.loadMoreResults();
    return;
  }

  store.loadMoreFixtures();
}
</script>
