import { describe, expect, it } from 'vitest';
import {
  buildLiveScoreboardUrl,
  buildProxiedEspnRefUrl,
  buildScoreboardUrl,
  buildSoccerLeagueDetailUrl,
  buildSoccerLeaguesUrl,
  buildTeamFixtureScheduleUrl
} from './espnEndpoints';

describe('espn endpoints', () => {
  it('builds same-origin scoreboard URLs by default', () => {
    expect(buildScoreboardUrl('eng.1', '20260508')).toBe(
      '/api/espn/site/sports/soccer/eng.1/scoreboard?dates=20260508'
    );
  });

  it('builds all-soccer live scoreboard URLs', () => {
    expect(buildLiveScoreboardUrl('20260508')).toBe(
      '/api/espn/site/sports/soccer/all/scoreboard?dates=20260508&limit=200'
    );
  });

  it('converts core ESPN refs to same-origin proxy URLs', () => {
    expect(
      buildProxiedEspnRefUrl(
        'http://sports.core.api.espn.com/v2/sports/soccer/leagues/eng.1/venues/2267?lang=en&region=us'
      )
    ).toBe('/api/espn/core/sports/soccer/leagues/eng.1/venues/2267?lang=en&region=us');
  });

  it('builds web API team fixture schedule URLs', () => {
    expect(buildTeamFixtureScheduleUrl('364')).toBe(
      '/api/espn/web/sports/soccer/all/teams/364/schedule?fixture=true'
    );
  });

  it('builds core soccer league catalog URLs', () => {
    expect(buildSoccerLeaguesUrl()).toBe('/api/espn/core/sports/soccer/leagues?limit=1000');
  });

  it('builds core soccer league detail URLs', () => {
    expect(buildSoccerLeagueDetailUrl('eng.2')).toBe(
      '/api/espn/core/sports/soccer/leagues/eng.2?lang=en&region=us'
    );
  });
});
