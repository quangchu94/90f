<template>
  <RouterLink
    :to="{ name: 'team-detail', params: { leagueSlug: team.leagueSlug, teamId: team.id } }"
    class="flex min-h-24 items-center gap-3 rounded border border-app-border bg-app-surface p-3 transition hover:border-app-accent/60 hover:bg-app-elevated focus:outline-none focus:ring-2 focus:ring-app-accent"
  >
    <TeamLogo :src="team.logoUrl" :alt="team.name" :fallback-name="team.shortName" class="h-12 w-12" />
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-bold text-app-text">{{ team.name }}</p>
      <p class="mt-1 truncate text-xs text-app-secondary">{{ team.abbreviation ?? team.location ?? 'Đội bóng' }}</p>
    </div>
    <FavoriteTeamButton :is-favorite="isFavorite" @toggle="$emit('toggleFavorite')" />
  </RouterLink>
</template>

<script setup lang="ts">
import type { TeamDetail } from '@/domain/models';
import FavoriteTeamButton from '@/components/football/FavoriteTeamButton.vue';
import TeamLogo from '@/components/football/TeamLogo.vue';

defineProps<{
  team: TeamDetail;
  isFavorite: boolean;
}>();

defineEmits<{
  toggleFavorite: [];
}>();
</script>
