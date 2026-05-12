import { describe, expect, it } from 'vitest';
import {
  enrichLeagueMetadata,
  getLeagueBySlug,
  getLeagueShortName,
  getSupportedLeagueFallback,
  getTeamScheduleCandidateLeagues,
  sortLeaguesWithinGroup
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
    expect(enrichLeagueMetadata({ slug: 'ger.1', name: 'ger.1' })).toMatchObject({
      name: 'Bundesliga',
      shortName: 'Bundesliga'
    });
    expect(enrichLeagueMetadata({ slug: 'ger.1', name: 'German Bundesliga' })).toMatchObject({
      name: 'Bundesliga'
    });
    expect(enrichLeagueMetadata({ slug: 'ger.2', name: 'German 2. Bundesliga' })).toMatchObject({
      name: '2. Bundesliga',
      shortName: '2. Bundesliga'
    });
    expect(enrichLeagueMetadata({ slug: 'ger.2', name: 'ger.2', shortName: '2.' })).toMatchObject({
      name: '2. Bundesliga',
      shortName: '2. Bundesliga'
    });
    expect(enrichLeagueMetadata({ slug: 'eng.2', name: 'eng.2' })).toMatchObject({
      name: 'English League Championship',
      shortName: 'EFL Championship'
    });
    expect(enrichLeagueMetadata({ slug: 'ita.2', name: 'ita.2' })).toMatchObject({
      name: 'Italian Serie B',
      shortName: 'Italian Serie B'
    });
    expect(enrichLeagueMetadata({ slug: 'ger.dfb_pokal', name: 'ger.dfb_pokal' })).toMatchObject({
      name: 'German Cup',
      shortName: 'DFB Pokal'
    });
    expect(enrichLeagueMetadata({ slug: 'ger.unknown_cup', name: 'German Cup' })).toMatchObject({
      name: 'German Cup'
    });
    expect(enrichLeagueMetadata({ slug: 'esp.copa_del_rey', name: 'esp.copa_del_rey' })).toMatchObject({
      name: 'Spanish Copa del Rey',
      shortName: 'Copa del Rey'
    });
    expect(enrichLeagueMetadata({ slug: 'esp.super_cup', name: 'esp.super_cup' })).toMatchObject({
      name: 'Spanish Super Cup'
    });
    expect(enrichLeagueMetadata({ slug: 'usa.1', name: 'usa.1' })).toMatchObject({
      name: 'MLS',
      shortName: 'MLS',
      groupLabel: 'United States',
      groupType: 'country',
      countryCode: 'USA',
      confederation: 'CONCACAF'
    });
    expect(enrichLeagueMetadata({ slug: 'eng.2', name: 'English Championship' })).toMatchObject({
      name: 'English League Championship',
      shortName: 'EFL Championship'
    });
    expect(getLeagueShortName('ger.2', '2.', 'German 2. Bundesliga')).toBe('2. Bundesliga');
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

  it('scopes MLS team schedules to United States, matching continental, and world leagues', () => {
    const candidates = getTeamScheduleCandidateLeagues('usa.1', [
      { slug: 'usa.1', name: 'Major League Soccer' },
      { slug: 'usa.open_cup', name: 'U.S. Open Cup' },
      { slug: 'eng.1', name: 'Premier League' },
      { slug: 'concacaf.champions', name: 'CONCACAF Champions Cup', groupType: 'continental', confederation: 'CONCACAF' },
      { slug: 'fifa.world', name: 'FIFA World Cup' },
      { slug: 'club.friendly', name: 'Club Friendly' }
    ]);

    expect(candidates.map((league) => league.slug)).toEqual([
      'usa.1',
      'usa.open_cup',
      'concacaf.champions',
      'fifa.world'
    ]);
  });

  it('uses curated metadata for Leagues Cup', () => {
    expect(getLeagueBySlug('concacaf.leagues.cup')).toMatchObject({
      slug: 'concacaf.leagues.cup',
      name: 'Leagues Cup',
      shortName: 'Leagues Cup',
      groupType: 'continental',
      confederation: 'CONCACAF'
    });
  });


  it('sorts leagues inside a country group by natural competition order', () => {
    expect(
      sortLeaguesWithinGroup([
        { slug: 'eng.league_cup', name: 'English League Cup' },
        { slug: 'eng.fa', name: 'English FA Cup' },
        { slug: 'eng.2', name: 'English League Championship' },
        { slug: 'eng.1', name: 'Premier League' }
      ]).map((league) => league.slug)
    ).toEqual(['eng.1', 'eng.2', 'eng.fa', 'eng.league_cup']);

    expect(
      sortLeaguesWithinGroup([
        { slug: 'ger.dfb_pokal', name: 'German Cup' },
        { slug: 'ger.2', name: 'German 2. Bundesliga' },
        { slug: 'ger.1', name: 'German Bundesliga' }
      ]).map((league) => league.slug)
    ).toEqual(['ger.1', 'ger.2', 'ger.dfb_pokal']);
  });
});
