import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_LEAGUE_SLUGS } from '@/domain/leagues';
import { SELECTED_LEAGUES_STORAGE_KEY, useFixturesStore } from './fixturesStore';

describe('fixturesStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('uses default leagues when there is no stored selection', () => {
    const store = useFixturesStore();

    expect(store.selectedLeagueSlugs).toEqual(DEFAULT_LEAGUE_SLUGS);
  });

  it('restores selected leagues from client storage', () => {
    window.localStorage.setItem(SELECTED_LEAGUES_STORAGE_KEY, JSON.stringify(['ita.1', 'fra.1']));
    setActivePinia(createPinia());

    const store = useFixturesStore();

    expect(store.selectedLeagueSlugs).toEqual(['ita.1', 'fra.1']);
  });

  it('falls back to default leagues when stored data is invalid', () => {
    window.localStorage.setItem(SELECTED_LEAGUES_STORAGE_KEY, JSON.stringify(['unknown.league']));
    setActivePinia(createPinia());

    const store = useFixturesStore();

    expect(store.selectedLeagueSlugs).toEqual(DEFAULT_LEAGUE_SLUGS);
  });

  it('persists selected leagues after toggling a league', () => {
    const store = useFixturesStore();

    store.toggleLeague('ita.1');

    expect(JSON.parse(window.localStorage.getItem(SELECTED_LEAGUES_STORAGE_KEY) ?? '[]')).toEqual([
      ...DEFAULT_LEAGUE_SLUGS,
      'ita.1'
    ]);
  });
});
