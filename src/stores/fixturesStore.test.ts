import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_LEAGUE_SLUG, INITIAL_LEAGUES } from '@/domain/leagues';
import {
  FAVORITE_LEAGUES_STORAGE_KEY,
  SELECTED_LEAGUES_STORAGE_KEY,
  SELECTED_LEAGUE_STORAGE_KEY,
  useFixturesStore
} from './fixturesStore';

describe('fixturesStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('uses default favorite leagues and selected league when there is no stored selection', () => {
    const store = useFixturesStore();

    expect(store.favoriteLeagues).toEqual(INITIAL_LEAGUES);
    expect(store.selectedLeagueSlug).toBe(DEFAULT_LEAGUE_SLUG);
  });

  it('migrates legacy selected league arrays to a single selected league', () => {
    window.localStorage.setItem(SELECTED_LEAGUES_STORAGE_KEY, JSON.stringify(['ita.1', 'fra.1']));
    setActivePinia(createPinia());

    const store = useFixturesStore();

    expect(store.selectedLeagueSlug).toBe('ita.1');
  });

  it('falls back to default league when stored data is invalid', () => {
    window.localStorage.setItem(SELECTED_LEAGUE_STORAGE_KEY, JSON.stringify('unknown.league'));
    setActivePinia(createPinia());

    const store = useFixturesStore();

    expect(store.selectedLeagueSlug).toBe(DEFAULT_LEAGUE_SLUG);
  });

  it('loads 10 more days at a time', () => {
    const store = useFixturesStore();

    store.loadMoreResults();
    store.loadMoreFixtures();

    expect(store.resultDayCount).toBe(12);
    expect(store.fixtureDayCount).toBe(12);
  });

  it('persists favorite leagues and selects the newly added league', () => {
    const store = useFixturesStore();

    store.addFavoriteLeague({ slug: 'usa.1', name: 'MLS', shortName: 'MLS' });

    expect(store.selectedLeagueSlug).toBe('usa.1');
    expect(JSON.parse(window.localStorage.getItem(SELECTED_LEAGUE_STORAGE_KEY) ?? 'null')).toBe('usa.1');
    expect(JSON.parse(window.localStorage.getItem(FAVORITE_LEAGUES_STORAGE_KEY) ?? '[]')).toContainEqual({
      slug: 'usa.1',
      name: 'MLS',
      shortName: 'MLS',
      groupLabel: 'USA',
      groupType: 'other',
      isExcludedFromTeamSchedule: false
    });
  });

  it('removes favorite leagues and persists the change', () => {
    const store = useFixturesStore();

    store.removeFavoriteLeague('esp.1');

    expect(store.favoriteLeagues.some((league) => league.slug === 'esp.1')).toBe(false);
    expect(JSON.parse(window.localStorage.getItem(FAVORITE_LEAGUES_STORAGE_KEY) ?? '[]')).not.toContainEqual(
      expect.objectContaining({ slug: 'esp.1' })
    );
  });

  it('keeps the final favorite league active', () => {
    window.localStorage.setItem(
      FAVORITE_LEAGUES_STORAGE_KEY,
      JSON.stringify([{ slug: 'eng.1', name: 'Premier League' }])
    );
    window.localStorage.setItem(SELECTED_LEAGUE_STORAGE_KEY, JSON.stringify('eng.1'));
    setActivePinia(createPinia());
    const store = useFixturesStore();

    store.removeFavoriteLeague('eng.1');

    expect(store.favoriteLeagues.map((league) => league.slug)).toEqual(['eng.1']);
    expect(store.selectedLeagueSlug).toBe('eng.1');
  });

  it('moves selection when removing the selected favorite league', () => {
    const store = useFixturesStore();

    store.removeFavoriteLeague('eng.1');

    expect(store.selectedLeagueSlug).not.toBe('eng.1');
    expect(store.favoriteLeagues.map((league) => league.slug)).toContain(store.selectedLeagueSlug);
  });
});
