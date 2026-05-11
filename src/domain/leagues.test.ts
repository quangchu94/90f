import { describe, expect, it } from 'vitest';
import {
  enrichLeagueMetadata,
  getSupportedLeagueFallback,
  getTeamScheduleCandidateLeagues
} from './leagues';

describe('league metadata', () => {
  it('classifies domestic UEFA leagues by country', () => {
    expect(enrichLeagueMetadata({ slug: 'eng.1', name: 'Premier League' })).toMatchObject({
      groupLabel: 'England',
      groupType: 'country',
      countryCode: 'ENG',
      confederation: 'UEFA',
      isExcludedFromTeamSchedule: false
    });
  });

  it('classifies continental and world leagues', () => {
    expect(enrichLeagueMetadata({ slug: 'uefa.champions', name: 'UEFA Champions League' })).toMatchObject({
      groupLabel: 'Europe / UEFA',
      groupType: 'continental',
      confederation: 'UEFA'
    });
    expect(enrichLeagueMetadata({ slug: 'fifa.world', name: 'FIFA World Cup' })).toMatchObject({
      groupLabel: 'World',
      groupType: 'world'
    });
  });

  it('excludes friendlies and misc leagues from team schedules', () => {
    expect(enrichLeagueMetadata({ slug: 'club.friendly', name: 'Club Friendly' })).toMatchObject({
      groupLabel: 'Misc',
      groupType: 'misc',
      isExcludedFromTeamSchedule: true
    });
    expect(enrichLeagueMetadata({ slug: 'misc.1', name: 'Misc' })).toMatchObject({
      groupLabel: 'Misc',
      groupType: 'misc',
      isExcludedFromTeamSchedule: true
    });
  });

  it('uses curated and humanized names instead of raw slugs', () => {
    expect(enrichLeagueMetadata({ slug: 'esp.copa_del_rey', name: 'esp.copa_del_rey' })).toMatchObject({
      name: 'Spanish Copa del Rey',
      shortName: 'Copa del Rey'
    });
    expect(enrichLeagueMetadata({ slug: 'esp.super_cup', name: 'esp.super_cup' })).toMatchObject({
      name: 'Spanish Super Cup'
    });
    expect(enrichLeagueMetadata({ slug: 'usa.1', name: 'usa.1' })).toMatchObject({
      name: 'USA 1'
    });
  });

  it('falls back unsupported route leagues to a supported league in the same family', () => {
    expect(getSupportedLeagueFallback('esp.copa_del_rey')).toBe('esp.1');
    expect(getSupportedLeagueFallback('uefa.europa')).toBe('uefa.champions');
    expect(getSupportedLeagueFallback('unknown.league')).toBe('eng.1');
  });

  it('scopes domestic team schedules to country, confederation, and world leagues', () => {
    const candidates = getTeamScheduleCandidateLeagues('eng.1', [
      { slug: 'eng.1', name: 'Premier League' },
      { slug: 'eng.2', name: 'Championship' },
      { slug: 'esp.1', name: 'La Liga' },
      { slug: 'uefa.champions', name: 'UEFA Champions League' },
      { slug: 'fifa.world', name: 'FIFA World Cup' },
      { slug: 'club.friendly', name: 'Club Friendly' }
    ]);

    expect(candidates.map((league) => league.slug)).toEqual([
      'eng.1',
      'eng.2',
      'uefa.champions',
      'fifa.world'
    ]);
  });
});
