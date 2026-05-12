<template>
  <section aria-label="Chọn giải đấu" class="space-y-3">
    <div class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="league in favoriteLeagues"
        :key="league.slug"
        type="button"
        :class="buttonClass(league.slug)"
        @click="$emit('select', league.slug)"
      >
        {{ leagueDisplayLabel(league) }}
      </button>
      <button
        type="button"
        class="h-9 shrink-0 rounded border border-app-border bg-app-surface px-3 text-sm font-semibold text-app-secondary transition hover:bg-app-elevated hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
        @click="openPicker"
      >
        Chọn giải
      </button>
    </div>

    <div
      v-if="isPickerOpen"
      class="fixed inset-0 z-50 flex items-end bg-black/60 p-3 sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Chọn giải đấu ESPN"
      @click.self="closePicker"
    >
      <div class="max-h-[82vh] w-full max-w-xl overflow-hidden rounded border border-app-border bg-app-surface shadow-xl">
        <div class="border-b border-app-border p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-base font-bold">Chọn giải đấu</h2>
              <p class="mt-1 text-sm text-app-secondary">Tìm trong danh sách giải được hỗ trợ.</p>
            </div>
            <button
              type="button"
              class="rounded border border-app-border px-3 py-1 text-sm font-semibold text-app-secondary transition hover:bg-app-elevated hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
              @click="closePicker"
            >
              Đóng
            </button>
          </div>
          <input
            v-model="searchTerm"
            type="search"
            class="mt-4 h-11 w-full rounded border border-app-border bg-app-bg px-3 text-sm text-app-text outline-none transition placeholder:text-app-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/30"
            placeholder="Tìm theo tên hoặc slug"
          />
        </div>

        <div class="max-h-[52vh] overflow-y-auto p-2">
          <div v-if="isLoading" class="space-y-2 p-2">
            <div v-for="item in 8" :key="item" class="h-12 animate-pulse rounded bg-app-elevated" />
          </div>

          <div v-else-if="isError" class="p-4 text-sm text-app-danger">
            Không thể tải danh sách giải từ ESPN. Hãy thử lại sau.
          </div>

          <div v-else-if="!filteredLeagues.length" class="p-4 text-sm text-app-secondary">
            Không tìm thấy giải phù hợp.
          </div>

          <div v-else class="space-y-4">
            <div v-if="isFetching" class="px-2 text-xs font-semibold text-app-secondary">
              Đang tải thêm giải...
            </div>
            <div v-for="group in groupedLeagues" :key="group.label" class="space-y-1">
              <button
                type="button"
                class="flex w-full items-center justify-between rounded px-2 py-2 text-left text-xs font-bold uppercase text-app-muted transition hover:bg-app-elevated hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
                :aria-expanded="isGroupExpanded(group)"
                @click="toggleGroup(group.label)"
              >
                <span>{{ group.label }}</span>
                <span class="flex items-center gap-2">
                  <span>{{ group.leagues.length }}</span>
                  <span class="text-sm leading-none">{{ isGroupExpanded(group) ? '−' : '+' }}</span>
                </span>
              </button>
              <div
                v-if="isGroupExpanded(group)"
                v-for="league in group.leagues"
                :key="league.slug"
                class="flex w-full items-center justify-between gap-3 rounded px-3 py-2 transition hover:bg-app-elevated"
              >
                <button
                  type="button"
                  class="min-w-0 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-app-accent"
                  @click="handleLeaguePick(league)"
                >
                  <span class="block truncate text-sm font-semibold text-app-text">{{ leagueDisplayLabel(league) }}</span>
                  <span class="block truncate text-xs text-app-secondary">{{ league.slug }}</span>
                </button>
                <span class="flex shrink-0 items-center gap-2">
                  <span class="text-xs font-bold text-app-amber">{{ leagueDisplayLabel(league) }}</span>
                  <button
                    v-if="isFavorite(league.slug)"
                    type="button"
                    class="rounded border border-app-border px-2 py-1 text-xs font-semibold text-app-secondary transition hover:border-app-danger hover:text-app-danger focus:outline-none focus:ring-2 focus:ring-app-accent disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="!canRemoveFavorite(league.slug)"
                    @click.stop="handleFavoriteRemove(league.slug)"
                  >
                    Bỏ theo dõi
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { LeagueSummary } from '@/domain/models';
import {
  getLeagueShortName,
  mergeLeagueSummaries,
  sortLeagueGroups,
  sortLeaguesWithinGroup
} from '@/domain/leagues';
import { useSoccerLeagues } from '@/composables/useSoccerLeagues';

const props = defineProps<{
  selectedLeagueSlug: string;
  favoriteLeagues: LeagueSummary[];
}>();

const emit = defineEmits<{
  select: [leagueSlug: string];
  addFavorite: [league: LeagueSummary];
  removeFavorite: [leagueSlug: string];
}>();

const isPickerOpen = ref(false);
const searchTerm = ref('');
const expandedGroupLabels = ref<Set<string>>(new Set());
const { data: catalogLeagues, isLoading, isFetching, isError } = useSoccerLeagues();

const allLeagues = computed(() =>
  mergeLeagueSummaries([...(catalogLeagues.value ?? []), ...props.favoriteLeagues])
);
const filteredLeagues = computed(() => {
  const query = searchTerm.value.trim().toLowerCase();

  if (!query) {
    return allLeagues.value;
  }

  return allLeagues.value.filter((league) =>
    `${league.name} ${league.shortName ?? ''} ${league.slug}`.toLowerCase().includes(query)
  );
});
const groupedLeagues = computed(() => {
  const groups = new Map<string, LeagueSummary[]>();

  for (const league of filteredLeagues.value) {
    const label = league.groupLabel ?? 'Other';
    groups.set(label, [...(groups.get(label) ?? []), league]);
  }

  return sortLeagueGroups([...groups.entries()]
    .map(([label, leagues]) => ({
      label,
      leagues: sortLeaguesWithinGroup(leagues)
    })));
});

function buttonClass(leagueSlug: string): string {
  const base =
    'h-9 shrink-0 rounded border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-app-accent';

  return props.selectedLeagueSlug === leagueSlug
    ? `${base} border-app-accent bg-app-accent text-white`
    : `${base} border-app-border bg-app-surface text-app-secondary hover:bg-app-elevated hover:text-app-text`;
}

function openPicker(): void {
  expandedGroupLabels.value = getDefaultExpandedGroupLabels();
  isPickerOpen.value = true;
}

function closePicker(): void {
  isPickerOpen.value = false;
  searchTerm.value = '';
}

function handleLeaguePick(league: LeagueSummary): void {
  emit('addFavorite', league);
  closePicker();
}

function isFavorite(leagueSlug: string): boolean {
  return props.favoriteLeagues.some((league) => league.slug === leagueSlug);
}

function canRemoveFavorite(leagueSlug: string): boolean {
  return props.favoriteLeagues.length > 1 || props.selectedLeagueSlug !== leagueSlug;
}

function handleFavoriteRemove(leagueSlug: string): void {
  if (!canRemoveFavorite(leagueSlug)) {
    return;
  }

  emit('removeFavorite', leagueSlug);
}

function leagueDisplayLabel(league: LeagueSummary): string {
  return getLeagueShortName(league.slug, league.shortName, league.name);
}

function getDefaultExpandedGroupLabels(): Set<string> {
  const favoriteSlugs = new Set(props.favoriteLeagues.map((league) => league.slug));
  const labels = new Set<string>();

  for (const league of allLeagues.value) {
    if (favoriteSlugs.has(league.slug) || league.slug === props.selectedLeagueSlug) {
      labels.add(league.groupLabel ?? 'Other');
    }
  }

  return labels;
}

function isGroupExpanded(group: { label: string; leagues: LeagueSummary[] }): boolean {
  if (searchTerm.value.trim()) {
    return true;
  }

  return expandedGroupLabels.value.has(group.label);
}

function toggleGroup(groupLabel: string): void {
  const nextExpandedGroupLabels = new Set(expandedGroupLabels.value);

  if (nextExpandedGroupLabels.has(groupLabel)) {
    nextExpandedGroupLabels.delete(groupLabel);
  } else {
    nextExpandedGroupLabels.add(groupLabel);
  }

  expandedGroupLabels.value = nextExpandedGroupLabels;
}
</script>
