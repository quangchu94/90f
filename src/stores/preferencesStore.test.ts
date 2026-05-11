import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAVORITE_TEAMS_STORAGE_KEY, usePreferencesStore } from './preferencesStore';

describe('preferencesStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('starts without favorite teams when storage is empty', () => {
    const store = usePreferencesStore();

    expect(store.favoriteTeams).toEqual([]);
  });

  it('restores favorite teams from client storage', () => {
    window.localStorage.setItem(
      FAVORITE_TEAMS_STORAGE_KEY,
      JSON.stringify([{ leagueSlug: 'eng.1', teamId: '359' }])
    );
    setActivePinia(createPinia());

    const store = usePreferencesStore();

    expect(store.isFavoriteTeam('eng.1', '359')).toBe(true);
  });

  it('falls back to an empty list when storage is malformed', () => {
    window.localStorage.setItem(FAVORITE_TEAMS_STORAGE_KEY, JSON.stringify({ broken: true }));
    setActivePinia(createPinia());

    const store = usePreferencesStore();

    expect(store.favoriteTeams).toEqual([]);
  });

  it('toggles and persists favorite teams', () => {
    const store = usePreferencesStore();

    store.toggleFavoriteTeam('eng.1', '359');
    expect(store.isFavoriteTeam('eng.1', '359')).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(FAVORITE_TEAMS_STORAGE_KEY) ?? '[]')).toEqual([
      { leagueSlug: 'eng.1', teamId: '359' }
    ]);

    store.toggleFavoriteTeam('eng.1', '359');
    expect(store.isFavoriteTeam('eng.1', '359')).toBe(false);
  });
});
