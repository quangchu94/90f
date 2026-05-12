<template>
  <section class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-bold">{{ leagueLabel }}</h2>
        <p class="text-xs text-app-muted">{{ subtitle }}</p>
      </div>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div v-for="item in 2" :key="item" class="h-24 animate-pulse rounded border border-app-border bg-app-surface" />
    </div>

    <StateBlock
      v-else-if="isError && !matchesForDisplay.length"
      title="Không thể tải dữ liệu"
      message="Có thể ESPN đang chặn CORS hoặc tạm thời quá tải. Dữ liệu cũ sẽ được giữ lại khi có thể."
      action-label="Thử lại"
      @action="refetchAll"
    />

    <div v-else-if="visibleDateGroups.length" class="space-y-5">
      <p v-if="isError" class="rounded border border-app-danger/40 bg-app-danger/10 px-3 py-2 text-sm text-app-danger">
        Cập nhật mới nhất thất bại, đang hiển thị dữ liệu đã tải trước đó.
      </p>
      <LeagueDateMatches
        v-for="group in visibleDateGroups"
        :key="group.date"
        :date="group.date"
        :mode="mode"
        :matches="group.matches"
        @refetch="refetchAll"
      />
    </div>

    <StateBlock
      v-else
      title="Không có trận nào trong khoảng thời gian này"
      :message="emptyMessage"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import { getLeagueBySlug, getLeagueShortName } from '@/domain/leagues';
import { dedupeMatchesById, filterMatchesForModeDate } from '@/domain/matchFilters';
import type { LeagueSummary } from '@/domain/models';
import type { FixtureMode } from '@/stores/fixturesStore';
import { useScoreboards } from '@/composables/useScoreboards';
import { getScoreboardSourceDateRange } from '@/utils/date';
import LeagueDateMatches from './LeagueDateMatches.vue';
import StateBlock from '@/components/common/StateBlock.vue';

const props = defineProps<{
  leagueSlug: string;
  leagueSummary?: LeagueSummary;
  dates: string[];
  mode: FixtureMode;
}>();

const league = computed(() => props.leagueSummary ?? getLeagueBySlug(props.leagueSlug));
const leagueLabel = computed(() => getLeagueShortName(league.value.slug, league.value.shortName, league.value.name));
const subtitle = computed(() =>
  props.mode === 'results' ? 'Các trận đã kết thúc' : 'Các trận sắp diễn ra'
);
const leagueSlug = toRef(props, 'leagueSlug');
const sourceDates = computed(() => getScoreboardSourceDateRange(props.dates));
const { matches, isLoading, isError, refetchAll } = useScoreboards(leagueSlug, sourceDates);
const matchesForDisplay = computed(() => dedupeMatchesById(matches.value));
const visibleDateGroups = computed(() =>
  props.dates
    .map((date) => ({
      date,
      matches: filterMatchesForModeDate(matchesForDisplay.value, props.mode, date)
    }))
    .filter((group) => group.matches.length > 0)
);
const emptyMessage = computed(() =>
  props.mode === 'results'
    ? 'Hãy thử tải thêm kết quả hoặc chọn thêm giải đấu.'
    : 'Hãy thử tải thêm lịch đấu hoặc chọn thêm giải đấu.'
);
</script>
