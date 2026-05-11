import { defineStore } from 'pinia';
import { DEFAULT_LEAGUE_SLUG, INITIAL_LEAGUES, mergeLeagueSummaries } from '@/domain/leagues';
import type { LeagueSummary } from '@/domain/models';

export type FixtureMode = 'results' | 'fixtures';

export const SELECTED_LEAGUES_STORAGE_KEY = '90f:selected-leagues';
export const SELECTED_LEAGUE_STORAGE_KEY = '90f:selected-league';
export const FAVORITE_LEAGUES_STORAGE_KEY = '90f:favorite-leagues';

const defaultFavoriteLeagues = INITIAL_LEAGUES;
const defaultLeagueSlugs = new Set(defaultFavoriteLeagues.map((league) => league.slug));

function isLeagueSummary(value: unknown): value is LeagueSummary {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (
    'slug' in value &&
    'name' in value &&
    typeof value.slug === 'string' &&
    typeof value.name === 'string'
  );
}

function readJsonStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : null;
  } catch {
    return null;
  }
}

function writeJsonStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable in private mode or restricted browser contexts.
  }
}

function readFavoriteLeagues(): LeagueSummary[] {
  const storedFavorites = readJsonStorage<unknown>(FAVORITE_LEAGUES_STORAGE_KEY);

  if (Array.isArray(storedFavorites)) {
    const validFavorites = storedFavorites.filter(isLeagueSummary);
    if (validFavorites.length) {
      return mergeLeagueSummaries(validFavorites);
    }
  }

  const legacySelection = readJsonStorage<unknown>(SELECTED_LEAGUES_STORAGE_KEY);
  if (Array.isArray(legacySelection)) {
    const legacyFavorites = legacySelection
      .filter((value): value is string => typeof value === 'string')
      .map((slug) => INITIAL_LEAGUES.find((league) => league.slug === slug) ?? { slug, name: slug });

    if (legacyFavorites.length) {
      return mergeLeagueSummaries(legacyFavorites);
    }
  }

  return [...defaultFavoriteLeagues];
}

function readSelectedLeagueSlug(favoriteLeagues: LeagueSummary[]): string {
  const favoriteSlugs = new Set(favoriteLeagues.map((league) => league.slug));
  const storedSelected = readJsonStorage<unknown>(SELECTED_LEAGUE_STORAGE_KEY);

  if (typeof storedSelected === 'string' && favoriteSlugs.has(storedSelected)) {
    return storedSelected;
  }

  const legacySelection = readJsonStorage<unknown>(SELECTED_LEAGUES_STORAGE_KEY);
  if (Array.isArray(legacySelection)) {
    const firstValidLegacySlug = legacySelection.find(
      (value): value is string =>
        typeof value === 'string' && (favoriteSlugs.has(value) || defaultLeagueSlugs.has(value))
    );

    if (firstValidLegacySlug) {
      return firstValidLegacySlug;
    }
  }

  return favoriteSlugs.has(DEFAULT_LEAGUE_SLUG)
    ? DEFAULT_LEAGUE_SLUG
    : favoriteLeagues[0]?.slug ?? DEFAULT_LEAGUE_SLUG;
}

function persistFavoriteLeagues(favoriteLeagues: LeagueSummary[]): void {
  writeJsonStorage(FAVORITE_LEAGUES_STORAGE_KEY, favoriteLeagues);
}

function persistSelectedLeagueSlug(leagueSlug: string): void {
  writeJsonStorage(SELECTED_LEAGUE_STORAGE_KEY, leagueSlug);
}

function getInitialState(): { selectedLeagueSlug: string; favoriteLeagues: LeagueSummary[] } {
  const favoriteLeagues = readFavoriteLeagues();
  return {
    favoriteLeagues,
    selectedLeagueSlug: readSelectedLeagueSlug(favoriteLeagues)
  };
}

export const useFixturesStore = defineStore('fixtures', {
  state: () => ({
    activeTab: 'results' as FixtureMode,
    resultDayCount: 2,
    fixtureDayCount: 2,
    ...getInitialState()
  }),
  actions: {
    setActiveTab(tab: FixtureMode) {
      this.activeTab = tab;
    },
    loadMoreResults() {
      this.resultDayCount += 10;
    },
    loadMoreFixtures() {
      this.fixtureDayCount += 10;
    },
    selectLeague(leagueSlug: string) {
      const league = this.favoriteLeagues.find((favorite) => favorite.slug === leagueSlug);

      if (!league) {
        return;
      }

      this.selectedLeagueSlug = league.slug;
      persistSelectedLeagueSlug(league.slug);
    },
    addFavoriteLeague(league: LeagueSummary) {
      const mergedFavorites = mergeLeagueSummaries([...this.favoriteLeagues, league]);
      this.favoriteLeagues = mergedFavorites;
      this.selectedLeagueSlug = league.slug;
      persistFavoriteLeagues(mergedFavorites);
      persistSelectedLeagueSlug(league.slug);
    },
    removeFavoriteLeague(leagueSlug: string) {
      if (this.favoriteLeagues.length <= 1) {
        return;
      }

      const nextFavorites = this.favoriteLeagues.filter((league) => league.slug !== leagueSlug);
      if (!nextFavorites.length || nextFavorites.length === this.favoriteLeagues.length) {
        return;
      }

      this.favoriteLeagues = nextFavorites;

      if (this.selectedLeagueSlug === leagueSlug) {
        this.selectedLeagueSlug = nextFavorites[0].slug;
        persistSelectedLeagueSlug(this.selectedLeagueSlug);
      }

      persistFavoriteLeagues(nextFavorites);
    }
  }
});
