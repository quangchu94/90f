<template>
  <div class="space-y-5">
    <RouterLink
      :to="backTarget"
      class="inline-flex items-center rounded border border-app-border px-3 py-2 text-sm font-semibold text-app-secondary transition hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
    >
      Quay lại lịch thi đấu
    </RouterLink>

    <div v-if="isLoading" class="h-72 animate-pulse rounded border border-app-border bg-app-surface" />

    <StateBlock
      v-else-if="isError || !match"
      title="Không thể tải chi tiết trận"
      message="Vui lòng thử lại sau ít phút."
      action-label="Thử lại"
      @action="handleRefetch"
    />

    <section v-else class="space-y-5">
      <div class="rounded border border-app-border bg-app-surface p-4 shadow-soft sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-app-amber">{{ match.leagueName }}</p>
            <h1 class="mt-1 text-xl font-black sm:text-2xl">{{ match.homeTeam.name }} vs {{ match.awayTeam.name }}</h1>
          </div>
          <StatusBadge :status="match.status" :label="match.statusText" />
        </div>

        <div class="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div class="min-w-0 text-center">
            <TeamLogo :src="match.homeTeam.logoUrl" :alt="match.homeTeam.name" :fallback-name="match.homeTeam.shortName" class="mx-auto h-14 w-14" />
            <p class="mt-3 truncate text-sm font-bold sm:text-base">{{ match.homeTeam.name }}</p>
          </div>

          <div class="rounded border border-app-border bg-app-elevated px-4 py-3 text-center">
            <p class="text-3xl font-black">{{ scoreLabel(match.homeScore) }} - {{ scoreLabel(match.awayScore) }}</p>
            <p class="mt-1 text-xs font-semibold text-app-amber">{{ timeLabel }}</p>
          </div>

          <div class="min-w-0 text-center">
            <TeamLogo :src="match.awayTeam.logoUrl" :alt="match.awayTeam.name" :fallback-name="match.awayTeam.shortName" class="mx-auto h-14 w-14" />
            <p class="mt-3 truncate text-sm font-bold sm:text-base">{{ match.awayTeam.name }}</p>
          </div>
        </div>
      </div>

      <section class="rounded border border-app-border bg-app-surface p-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-bold">Diễn biến chính</h2>
          <span class="text-xs font-semibold text-app-muted">
            {{ match.goals.length }} bàn thắng · {{ match.redCards.length }} thẻ đỏ
          </span>
        </div>

        <div v-if="match.events.length" class="mt-4 space-y-2">
          <article
            v-for="event in match.events"
            :key="event.id"
            class="grid grid-cols-[1fr_5.75rem_1fr] items-center gap-3 rounded border border-app-border bg-app-elevated px-3 py-3"
            data-testid="timeline-event"
          >
            <div class="min-w-0 text-left" data-testid="home-event">
              <div v-if="eventSide(event) === 'home' || eventSide(event) === 'unknown'" class="min-w-0">
                <p class="truncate text-sm font-semibold">{{ event.playerName }}</p>
                <p class="truncate text-xs text-app-secondary">{{ event.teamName ?? event.text }}</p>
              </div>
            </div>

            <div class="text-center">
              <p class="text-sm font-black text-app-amber">{{ event.displayMinute || '-' }}</p>
              <span :class="eventBadgeClass(event.type)" data-testid="event-badge">
                {{ event.type === 'goal' ? 'Bàn thắng' : 'Thẻ đỏ' }}
              </span>
            </div>

            <div class="min-w-0 text-right" data-testid="away-event">
              <div v-if="eventSide(event) === 'away'" class="min-w-0">
                <p class="truncate text-sm font-semibold">{{ event.playerName }}</p>
                <p class="truncate text-xs text-app-secondary">{{ event.teamName ?? event.text }}</p>
              </div>
            </div>
          </article>
        </div>

        <p v-else class="mt-3 text-sm text-app-secondary">Chưa có sự kiện trận đấu.</p>
      </section>

      <div class="grid gap-3 sm:grid-cols-2">
        <section class="rounded border border-app-border bg-app-surface p-4">
          <h2 class="text-base font-bold">Thông tin trận</h2>
          <dl class="mt-3 space-y-3 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-app-secondary">Thời gian</dt>
              <dd class="text-right font-semibold">{{ timeLabel }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-app-secondary">Sân vận động</dt>
              <dd class="text-right font-semibold">{{ match.venue ?? 'Chưa có dữ liệu' }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-app-secondary">Khán giả</dt>
              <dd class="text-right font-semibold">{{ attendanceLabel }}</dd>
            </div>
          </dl>
        </section>

        <section class="rounded border border-app-border bg-app-surface p-4">
          <h2 class="text-base font-bold">Phát sóng</h2>
          <p class="mt-3 text-sm text-app-secondary">{{ broadcastLabel }}</p>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useRoute } from 'vue-router';
import type { MatchEvent, MatchEventType } from '@/domain/models';
import { useMatchSummary } from '@/composables/useMatchSummary';
import { formatKickoffDateTime } from '@/utils/date';
import StatusBadge from '@/components/football/StatusBadge.vue';
import TeamLogo from '@/components/football/TeamLogo.vue';
import StateBlock from '@/components/common/StateBlock.vue';

const props = defineProps<{
  leagueSlug: string;
  eventId: string;
}>();

const { leagueSlug, eventId } = toRefs(props);
const route = useRoute();
const { data: match, isLoading, isError, refetch } = useMatchSummary(leagueSlug, eventId);
const backTarget = computed(() => getSafeReturnTo(route.query.returnTo));

const timeLabel = computed(() => {
  if (!match.value?.kickoff) {
    return 'TBD';
  }

  return formatKickoffDateTime(match.value.kickoff);
});

const attendanceLabel = computed(() =>
  match.value?.attendance ? new Intl.NumberFormat('vi-VN').format(match.value.attendance) : 'Chưa có dữ liệu'
);

const broadcastLabel = computed(() =>
  match.value?.broadcasts.length ? match.value.broadcasts.join(', ') : 'Chưa có dữ liệu'
);

function scoreLabel(score: number | undefined): string {
  return score === undefined ? '-' : `${score}`;
}

function eventBadgeClass(type: MatchEventType): string {
  const base = 'mt-1 inline-flex rounded border px-2 py-1 text-xs font-semibold';

  return type === 'goal'
    ? `${base} border-app-live/50 bg-app-live/10 text-app-live`
    : `${base} border-app-danger/50 bg-app-danger/10 text-app-danger`;
}

function eventSide(event: MatchEvent): 'home' | 'away' | 'unknown' {
  if (event.teamId && event.teamId === match.value?.homeTeam.id) {
    return 'home';
  }

  if (event.teamId && event.teamId === match.value?.awayTeam.id) {
    return 'away';
  }

  return 'unknown';
}

function handleRefetch(): void {
  void refetch();
}

function getSafeReturnTo(returnTo: unknown): string {
  if (typeof returnTo !== 'string') {
    return '/fixtures';
  }

  return returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/fixtures';
}
</script>
