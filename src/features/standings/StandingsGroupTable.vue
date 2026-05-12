<template>
  <article class="overflow-hidden rounded border border-app-border bg-app-surface">
    <header class="border-b border-app-border bg-app-elevated px-4 py-3">
      <h2 class="text-sm font-bold text-app-text">{{ group.name }}</h2>
    </header>

    <div>
      <table class="w-full table-fixed text-left text-[0.7rem] sm:text-sm">
        <colgroup>
          <col class="w-7 sm:w-12" />
          <col />
          <col class="w-7 sm:w-14" />
          <col class="w-7 sm:w-14" />
          <col class="w-7 sm:w-14" />
          <col class="w-7 sm:w-14" />
          <col class="w-8 sm:w-14" />
          <col class="w-8 sm:w-14" />
        </colgroup>
        <thead class="text-xs uppercase text-app-muted">
          <tr class="border-b border-app-border">
            <th class="px-1 py-3 text-center sm:px-3">#</th>
            <th class="px-1 py-3 sm:px-3">Đội</th>
            <th class="px-0.5 py-3 text-center sm:px-2">Tr</th>
            <th class="px-0.5 py-3 text-center sm:px-2">T</th>
            <th class="px-0.5 py-3 text-center sm:px-2">H</th>
            <th class="px-0.5 py-3 text-center sm:px-2">B</th>
            <th class="px-0.5 py-3 text-center sm:px-2">HS</th>
            <th class="px-0.5 py-3 text-center sm:px-2">Đ</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in sortedRows"
            :key="row.id"
            class="border-b border-app-border/70 last:border-b-0"
          >
            <td class="px-1 py-3 text-center font-bold text-app-secondary sm:px-3">{{ row.rank ?? '-' }}</td>
            <td class="min-w-0 px-1 py-3 sm:px-3">
              <RouterLink
                :to="{ name: 'team-detail', params: { leagueSlug, teamId: row.team.id } }"
                class="flex min-w-0 items-center gap-1 rounded focus:outline-none focus:ring-2 focus:ring-app-accent sm:gap-2"
              >
                <TeamLogo class="hidden sm:flex" :src="row.team.logoUrl" :alt="row.team.name" :fallback-name="row.team.shortName" />
                <span class="truncate font-semibold text-app-text">{{ row.team.name }}</span>
              </RouterLink>
            </td>
            <td class="px-0.5 py-3 text-center sm:px-2">{{ statLabel(row.played) }}</td>
            <td class="px-0.5 py-3 text-center sm:px-2">{{ statLabel(row.wins) }}</td>
            <td class="px-0.5 py-3 text-center sm:px-2">{{ statLabel(row.draws) }}</td>
            <td class="px-0.5 py-3 text-center sm:px-2">{{ statLabel(row.losses) }}</td>
            <td class="px-0.5 py-3 text-center sm:px-2">{{ statLabel(row.goalDifference) }}</td>
            <td class="px-0.5 py-3 text-center text-sm font-black text-app-amber sm:px-2 sm:text-base">{{ statLabel(row.points) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StandingGroup } from '@/domain/models';
import { sortStandingRowsByRank } from '@/domain/standings';
import TeamLogo from '@/components/football/TeamLogo.vue';

const props = defineProps<{
  group: StandingGroup;
  leagueSlug: string;
}>();

const sortedRows = computed(() => sortStandingRowsByRank(props.group.rows));

function statLabel(value: number | undefined): string {
  return value === undefined ? '-' : `${value}`;
}
</script>
