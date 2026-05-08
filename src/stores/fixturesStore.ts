import { defineStore } from 'pinia';
import { DEFAULT_LEAGUE_SLUGS, INITIAL_LEAGUES } from '@/domain/leagues';

export type FixtureMode = 'results' | 'fixtures';

export const SELECTED_LEAGUES_STORAGE_KEY = '90f:selected-leagues';

const supportedLeagueSlugs = new Set(INITIAL_LEAGUES.map((league) => league.slug));

function readStoredLeagueSlugs(): string[] | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(SELECTED_LEAGUES_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return null;
    }

    const leagueSlugs = parsedValue.filter(
      (value): value is string => typeof value === 'string' && supportedLeagueSlugs.has(value)
    );

    return leagueSlugs.length > 0 ? [...new Set(leagueSlugs)] : null;
  } catch {
    return null;
  }
}

function persistLeagueSlugs(leagueSlugs: string[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(SELECTED_LEAGUES_STORAGE_KEY, JSON.stringify(leagueSlugs));
  } catch {
    // Storage may be unavailable in private mode or restricted browser contexts.
  }
}

function getInitialLeagueSlugs(): string[] {
  return readStoredLeagueSlugs() ?? [...DEFAULT_LEAGUE_SLUGS];
}

export const useFixturesStore = defineStore('fixtures', {
  state: () => ({
    activeTab: 'results' as FixtureMode,
    resultDayCount: 2,
    fixtureDayCount: 2,
    selectedLeagueSlugs: getInitialLeagueSlugs()
  }),
  actions: {
    setActiveTab(tab: FixtureMode) {
      this.activeTab = tab;
    },
    loadMoreResults() {
      this.resultDayCount += 1;
    },
    loadMoreFixtures() {
      this.fixtureDayCount += 1;
    },
    toggleLeague(leagueSlug: string) {
      if (!supportedLeagueSlugs.has(leagueSlug)) {
        return;
      }

      if (this.selectedLeagueSlugs.includes(leagueSlug)) {
        if (this.selectedLeagueSlugs.length > 1) {
          this.selectedLeagueSlugs = this.selectedLeagueSlugs.filter((slug) => slug !== leagueSlug);
          persistLeagueSlugs(this.selectedLeagueSlugs);
        }
        return;
      }

      this.selectedLeagueSlugs.push(leagueSlug);
      persistLeagueSlugs(this.selectedLeagueSlugs);
    }
  }
});
