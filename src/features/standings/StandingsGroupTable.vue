<template>
  <article class="overflow-hidden rounded border border-app-border bg-app-surface">
    <header class="border-b border-app-border bg-app-elevated px-4 py-3">
      <h2 class="text-sm font-bold text-app-text">{{ group.name }}</h2>
    </header>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[42rem] table-fixed text-left text-sm">
        <colgroup>
          <col class="w-12" />
          <col />
          <col class="w-14" />
          <col class="w-14" />
          <col class="w-14" />
          <col class="w-14" />
          <col class="w-14" />
          <col class="w-14" />
        </colgroup>
        <thead class="text-xs uppercase text-app-muted">
          <tr class="border-b border-app-border">
            <th class="px-3 py-3 text-center">#</th>
            <th class="px-3 py-3">Đội</th>
            <th class="px-2 py-3 text-center">Tr</th>
            <th class="px-2 py-3 text-center">T</th>
            <th class="px-2 py-3 text-center">H</th>
            <th class="px-2 py-3 text-center">B</th>
            <th class="px-2 py-3 text-center">HS</th>
            <th class="px-2 py-3 text-center">Đ</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in sortedRows"
            :key="row.id"
            class="border-b border-app-border/70 last:border-b-0"
          >
            <td class="px-3 py-3 text-center font-bold text-app-secondary">{{ row.rank ?? '-' }}</td>
            <td class="min-w-0 px-3 py-3">
              <RouterLink
                :to="{ name: 'team-detail', params: { leagueSlug, teamId: row.team.id } }"
                class="flex min-w-0 items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-app-accent"
              >
                <TeamLogo :src="row.team.logoUrl" :alt="row.team.name" :fallback-name="row.team.shortName" />
                <span class="truncate font-semibold text-app-text">{{ row.team.name }}</span>
              </RouterLink>
            </td>
            <td class="px-2 py-3 text-center">{{ statLabel(row.played) }}</td>
            <td class="px-2 py-3 text-center">{{ statLabel(row.wins) }}</td>
            <td class="px-2 py-3 text-center">{{ statLabel(row.draws) }}</td>
            <td class="px-2 py-3 text-center">{{ statLabel(row.losses) }}</td>
            <td class="px-2 py-3 text-center">{{ statLabel(row.goalDifference) }}</td>
            <td class="px-2 py-3 text-center text-base font-black text-app-amber">{{ statLabel(row.points) }}</td>
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
