import { defineStore } from 'pinia';

export interface FavoriteTeam {
  leagueSlug: string;
  teamId: string;
}

export const FAVORITE_TEAMS_STORAGE_KEY = '90f:favorite-teams';

function isFavoriteTeam(value: unknown): value is FavoriteTeam {
  return (
    typeof value === 'object' &&
    value !== null &&
    'leagueSlug' in value &&
    'teamId' in value &&
    typeof value.leagueSlug === 'string' &&
    typeof value.teamId === 'string'
  );
}

function favoriteKey(favorite: FavoriteTeam): string {
  return `${favorite.leagueSlug}:${favorite.teamId}`;
}

function readStoredFavoriteTeams(): FavoriteTeam[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(FAVORITE_TEAMS_STORAGE_KEY);
    const parsedValue: unknown = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    const uniqueFavorites = new Map<string, FavoriteTeam>();
    for (const item of parsedValue) {
      if (isFavoriteTeam(item)) {
        uniqueFavorites.set(favoriteKey(item), item);
      }
    }

    return [...uniqueFavorites.values()];
  } catch {
    return [];
  }
}

function persistFavoriteTeams(favorites: FavoriteTeam[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(FAVORITE_TEAMS_STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Storage may be unavailable in private mode or restricted browser contexts.
  }
}

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    favoriteTeams: readStoredFavoriteTeams()
  }),
  actions: {
    isFavoriteTeam(leagueSlug: string, teamId: string): boolean {
      return this.favoriteTeams.some(
        (favorite) => favorite.leagueSlug === leagueSlug && favorite.teamId === teamId
      );
    },
    toggleFavoriteTeam(leagueSlug: string, teamId: string) {
      if (this.isFavoriteTeam(leagueSlug, teamId)) {
        this.favoriteTeams = this.favoriteTeams.filter(
          (favorite) => favorite.leagueSlug !== leagueSlug || favorite.teamId !== teamId
        );
      } else {
        this.favoriteTeams.push({ leagueSlug, teamId });
      }

      persistFavoriteTeams(this.favoriteTeams);
    }
  }
});
