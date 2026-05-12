import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  espnHttpClient,
  fetchSoccerLeagueDetail,
  fetchSoccerLeagueDetailsForPicker,
  fetchSoccerLeagues,
  fetchSoccerLeaguesForPicker,
  fetchTeamDetail,
  fetchTeamSchedule,
  mergeTeamScheduleResponses
} from './espnClient';
import type { EspnTeamScheduleResponse } from './espnTypes';

describe('espn client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches ESPN soccer league catalog from the core endpoint', async () => {
    vi.spyOn(espnHttpClient, 'getJson').mockResolvedValue({
      items: [
        { slug: 'usa.1', name: 'MLS', abbreviation: 'MLS' },
        { slug: 'eng.1', name: 'Premier League', abbreviation: 'EPL' }
      ]
    });

    const leagues = await fetchSoccerLeagues();

    expect(leagues).toContainEqual(expect.objectContaining({ slug: 'usa.1', name: 'MLS', shortName: 'MLS' }));
    expect(espnHttpClient.getJson).toHaveBeenCalledWith(
      '/api/espn/core/sports/soccer/leagues?limit=1000',
      undefined
    );
  });

  it('parses catalog league refs without dereferencing every league detail URL', async () => {
    const getJsonSpy = vi.spyOn(espnHttpClient, 'getJson').mockResolvedValue({
      items: [
        {
          $ref: 'http://sports.core.api.espn.com/v2/sports/soccer/leagues/usa.1?lang=en&region=us'
        },
        {
          $ref: 'http://sports.core.api.espn.com/v2/sports/soccer/leagues/esp.1?lang=en&region=us',
          name: 'Spanish LALIGA',
          abbreviation: 'LaLiga'
        }
      ]
    });

    const leagues = await fetchSoccerLeagues();

    expect(leagues).toContainEqual(
      expect.objectContaining({ slug: 'usa.1', name: 'MLS', shortName: 'MLS' })
    );
    expect(leagues).toContainEqual(
      expect.objectContaining({ slug: 'esp.1', name: 'La Liga', shortName: 'LaLiga' })
    );
    expect(getJsonSpy).toHaveBeenCalledTimes(1);
    expect(getJsonSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('/sports/soccer/leagues/usa.1'),
      expect.anything()
    );
  });

  it('fetches soccer league detail from the core endpoint', async () => {
    vi.spyOn(espnHttpClient, 'getJson').mockResolvedValue({
      slug: 'eng.2',
      name: 'English League Championship',
      displayName: 'English League Championship',
      abbreviation: 'EFL Championship',
      shortName: 'EFL Championship'
    });

    const league = await fetchSoccerLeagueDetail('eng.2');

    expect(league).toMatchObject({
      slug: 'eng.2',
      name: 'English League Championship',
      shortName: 'EFL Championship'
    });
    expect(espnHttpClient.getJson).toHaveBeenCalledWith(
      '/api/espn/core/sports/soccer/leagues/eng.2?lang=en&region=us',
      undefined
    );
  });

  it('enriches soccer leagues for picker with detail short names and tolerates detail failures', async () => {
    vi.spyOn(espnHttpClient, 'getJson').mockImplementation((url: string) => {
      if (url.includes('/leagues?limit=1000')) {
        return Promise.resolve({
          items: [
            {
              $ref: 'http://sports.core.api.espn.com/v2/sports/soccer/leagues/eng.2?lang=en&region=us'
            },
            {
              $ref: 'http://sports.core.api.espn.com/v2/sports/soccer/leagues/ita.2?lang=en&region=us'
            },
            {
              $ref: 'http://sports.core.api.espn.com/v2/sports/soccer/leagues/usa.1?lang=en&region=us'
            }
          ]
        });
      }

      if (url.includes('/leagues/eng.2?')) {
        return Promise.resolve({
          slug: 'eng.2',
          name: 'English League Championship',
          abbreviation: 'EFL Championship',
          shortName: 'EFL Championship'
        });
      }

      if (url.includes('/leagues/ita.2?')) {
        return Promise.resolve({
          slug: 'ita.2',
          name: 'Italian Serie B',
          abbreviation: 'Italian Serie B',
          shortName: 'Italian Serie B'
        });
      }

      return Promise.reject(new Error('Detail unavailable'));
    });

    const leagues = await fetchSoccerLeaguesForPicker();

    expect(leagues).toContainEqual(
      expect.objectContaining({ slug: 'eng.2', shortName: 'EFL Championship' })
    );
    expect(leagues).toContainEqual(
      expect.objectContaining({ slug: 'ita.2', shortName: 'Italian Serie B' })
    );
    expect(leagues).toContainEqual(
      expect.objectContaining({ slug: 'usa.1', name: 'MLS', shortName: 'MLS' })
    );
  });

  it('fetches picker league details independently so UI can render catalog data first', async () => {
    vi.spyOn(espnHttpClient, 'getJson').mockImplementation((url: string) => {
      if (url.includes('/leagues/eng.2?')) {
        return Promise.resolve({
          slug: 'eng.2',
          name: 'English League Championship',
          shortName: 'EFL Championship'
        });
      }

      return Promise.reject(new Error('Detail unavailable'));
    });

    const leagues = await fetchSoccerLeagueDetailsForPicker([
      { slug: 'eng.2', name: 'English 2' },
      { slug: 'usa.1', name: 'USA 1' }
    ]);

    expect(leagues).toEqual([
      expect.objectContaining({ slug: 'eng.2', shortName: 'EFL Championship' })
    ]);
    expect(espnHttpClient.getJson).toHaveBeenCalledWith(
      '/api/espn/core/sports/soccer/leagues/eng.2?lang=en&region=us',
      undefined
    );
    expect(espnHttpClient.getJson).toHaveBeenCalledWith(
      '/api/espn/core/sports/soccer/leagues/usa.1?lang=en&region=us',
      undefined
    );
  });


  it('prefers site team detail data before falling back to core team detail', async () => {
    const getJsonSpy = vi.spyOn(espnHttpClient, 'getJson').mockResolvedValue({
      team: {
        id: '363',
        displayName: 'Chelsea'
      },
      nextEvent: [
        {
          competitions: [
            {
              neutralSite: false,
              venue: { fullName: 'Stamford Bridge' },
              competitors: [
                { id: '363', homeAway: 'home', team: { id: '363', displayName: 'Chelsea' } },
                { id: '367', homeAway: 'away', team: { id: '367', displayName: 'Tottenham Hotspur' } }
              ]
            }
          ]
        }
      ]
    });

    const team = await fetchTeamDetail('eng.1', '363', undefined);

    expect(team.nextEvent?.[0].competitions?.[0].venue?.fullName).toBe('Stamford Bridge');
    expect(getJsonSpy).toHaveBeenCalledWith('/api/espn/site/sports/soccer/eng.1/teams/363', undefined);
    expect(getJsonSpy).not.toHaveBeenCalledWith(
      '/api/espn/core/sports/soccer/leagues/eng.1/teams/363',
      undefined
    );
  });

  it('merges team schedules from scoped leagues and all-fixture endpoint', async () => {
    vi.spyOn(espnHttpClient, 'getJson').mockImplementation((url: string) => {
      if (url.includes('/leagues?limit=1000')) {
        return Promise.resolve({
          items: [
            { slug: 'fra.1', name: 'French Ligue 1', abbreviation: 'Ligue 1' },
            { slug: 'uefa.champions', name: 'UEFA Champions League', abbreviation: 'UCL' }
          ]
        });
      }

      if (url.includes('/fra.1/')) {
        return Promise.resolve(makeSchedule('French Ligue 1', 'ligue-1-result'));
      }

      if (url.includes('/uefa.champions/')) {
        return Promise.resolve(makeSchedule('UEFA Champions League', 'ucl-result'));
      }

      if (url.includes('fixture=true')) {
        return Promise.resolve({
          events: [makeEvent('ucl-fixture', '2025-26 UEFA Champions League')]
        });
      }

      return Promise.reject(new Error('Team is not in this league'));
    });

    const schedule = await fetchTeamSchedule('fra.1', '160', undefined);

    expect(schedule.events?.map((event) => event.id)).toEqual([
      'ligue-1-result',
      'ucl-result',
      'ucl-fixture'
    ]);
    expect(schedule.events?.[0].leagues?.[0]).toMatchObject({
      slug: 'fra.1',
      name: 'Ligue 1'
    });
    expect(schedule.events?.[1].leagues?.[0]).toMatchObject({
      slug: 'uefa.champions',
      name: 'UEFA Champions League'
    });
  });

  it('enriches all-fixture events with concrete league data from matching league schedules', async () => {
    vi.spyOn(espnHttpClient, 'getJson').mockImplementation((url: string) => {
      if (url.includes('/leagues?limit=1000')) {
        return Promise.resolve({
          items: [{ slug: 'uefa.champions', name: 'UEFA Champions League', abbreviation: 'UCL' }]
        });
      }

      if (url.includes('/uefa.champions/')) {
        return Promise.resolve(makeSchedule('UEFA Champions League', 'shared-fixture'));
      }

      if (url.includes('fixture=true')) {
        return Promise.resolve({
          events: [makeEvent('shared-fixture', '2025-26 UEFA Champions League')]
        });
      }

      return Promise.reject(new Error('Team is not in this league'));
    });

    const schedule = await fetchTeamSchedule('fra.1', '160', undefined);
    const allFixtureEvent = schedule.events?.find((event) => event.id === 'shared-fixture');

    expect(allFixtureEvent?.leagues?.[0]).toMatchObject({
      slug: 'uefa.champions',
      name: 'UEFA Champions League'
    });
  });

  it('keeps canonical event league over source-only duplicate schedules', () => {
    const merged = mergeTeamScheduleResponses(
      [
        {
          events: [
            {
              ...makeEvent('401863595'),
              sourceLeague: { slug: 'esp.2', name: 'Spanish LALIGA 2', abbreviation: 'LALIGA 2' }
            }
          ]
        },
        {
          events: [
            {
              ...makeEvent('401863595', '2026 Leagues Cup'),
              league: { slug: 'concacaf.leagues.cup', name: 'Leagues Cup', abbreviation: 'Leagues Cup' }
            }
          ]
        }
      ],
      [
        { slug: 'esp.2', name: 'Spanish LALIGA 2', shortName: 'LALIGA 2' },
        { slug: 'concacaf.leagues.cup', name: 'Leagues Cup', shortName: 'Leagues Cup' }
      ]
    );

    expect(merged.events).toHaveLength(1);
    expect(merged.events?.[0].leagues?.[0]).toMatchObject({
      slug: 'concacaf.leagues.cup',
      name: 'Leagues Cup'
    });
  });

  it('does not render unsupported all-fixture club friendly events', async () => {
    vi.spyOn(espnHttpClient, 'getJson').mockImplementation((url: string) => {
      if (url.includes('/leagues?limit=1000')) {
        return Promise.resolve({
          items: [
            { slug: 'fra.1', name: 'French Ligue 1', abbreviation: 'Ligue 1' },
            { slug: 'club.friendly', name: 'Club Friendly' }
          ]
        });
      }

      if (url.includes('/fra.1/')) {
        return Promise.resolve(makeSchedule('French Ligue 1', 'ligue-1-result'));
      }

      if (url.includes('fixture=true')) {
        return Promise.resolve({
          events: [makeEvent('friendly-fixture', '2026 Club Friendly')]
        });
      }

      return Promise.reject(new Error('Team is not in this league'));
    });

    const schedule = await fetchTeamSchedule('fra.1', '160', undefined);

    expect(schedule.events?.map((event) => event.id)).toEqual(['ligue-1-result']);
    expect(schedule.events?.some((event) => event.id === 'friendly-fixture')).toBe(false);
  });

  it('queries domestic country, confederation, and FIFA schedules without unrelated countries', async () => {
    const requestedUrls: string[] = [];
    vi.spyOn(espnHttpClient, 'getJson').mockImplementation((url: string) => {
      requestedUrls.push(url);

      if (url.includes('/leagues?limit=1000')) {
        return Promise.resolve({
          items: [
            { slug: 'eng.1', name: 'Premier League', abbreviation: 'EPL' },
            { slug: 'eng.2', name: 'Championship' },
            { slug: 'esp.1', name: 'La Liga', abbreviation: 'LaLiga' },
            { slug: 'uefa.champions', name: 'UEFA Champions League', abbreviation: 'UCL' },
            { slug: 'fifa.world', name: 'FIFA World Cup' },
            { slug: 'club.friendly', name: 'Club Friendly' },
            { slug: 'misc.1', name: 'Misc' }
          ]
        });
      }

      if (url.includes('/eng.1/')) {
        return Promise.resolve(makeSchedule('Premier League', 'epl-result'));
      }

      if (url.includes('/uefa.champions/')) {
        return Promise.resolve(makeSchedule('UEFA Champions League', 'ucl-result'));
      }

      if (url.includes('fixture=true')) {
        return Promise.resolve({ events: [] });
      }

      return Promise.reject(new Error('Team is not in this league'));
    });

    const schedule = await fetchTeamSchedule('eng.1', '359', undefined);

    expect(schedule.events?.map((event) => event.id)).toEqual(['epl-result', 'ucl-result']);
    expect(requestedUrls.some((url) => url.includes('/esp.1/'))).toBe(false);
    expect(requestedUrls.some((url) => url.includes('/club.friendly/'))).toBe(false);
    expect(requestedUrls.some((url) => url.includes('/misc.1/'))).toBe(false);
    expect(requestedUrls.some((url) => url.includes('/eng.2/'))).toBe(true);
    expect(requestedUrls.some((url) => url.includes('/fifa.world/'))).toBe(true);
  });

  it('queries Spain, UEFA, and FIFA schedules for a Spain team without USA schedule calls', async () => {
    const requestedUrls: string[] = [];
    vi.spyOn(espnHttpClient, 'getJson').mockImplementation((url: string) => {
      requestedUrls.push(url);

      if (url.includes('/leagues?limit=1000')) {
        return Promise.resolve({
          items: [
            { slug: 'esp.1', name: 'Spanish LALIGA', abbreviation: 'LaLiga' },
            { slug: 'usa.1', name: 'MLS', abbreviation: 'MLS' },
            { slug: 'uefa.champions', name: 'UEFA Champions League', abbreviation: 'UCL' },
            { slug: 'fifa.world', name: 'FIFA World Cup' }
          ]
        });
      }

      if (url.includes('/esp.1/')) {
        return Promise.resolve(makeSchedule('Spanish LALIGA', 'laliga-result'));
      }

      if (url.includes('/uefa.champions/')) {
        return Promise.resolve(makeSchedule('UEFA Champions League', 'ucl-result'));
      }

      if (url.includes('fixture=true')) {
        return Promise.resolve({ events: [] });
      }

      return Promise.reject(new Error('Team is not in this league'));
    });

    const schedule = await fetchTeamSchedule('esp.1', '83', undefined);

    expect(schedule.events?.map((event) => event.id)).toEqual(['laliga-result', 'ucl-result']);
    expect(requestedUrls.some((url) => url.includes('/usa.1/teams/83/schedule'))).toBe(false);
    expect(requestedUrls.some((url) => url.includes('/esp.1/teams/83/schedule'))).toBe(true);
    expect(requestedUrls.some((url) => url.includes('/uefa.champions/teams/83/schedule'))).toBe(true);
    expect(requestedUrls.some((url) => url.includes('/fifa.world/teams/83/schedule'))).toBe(true);
  });

  it('falls back to non-excluded catalog schedules for continental routes', async () => {
    const requestedUrls: string[] = [];
    vi.spyOn(espnHttpClient, 'getJson').mockImplementation((url: string) => {
      requestedUrls.push(url);

      if (url.includes('/leagues?limit=1000')) {
        return Promise.resolve({
          items: [
            { slug: 'eng.1', name: 'Premier League', abbreviation: 'EPL' },
            { slug: 'esp.1', name: 'La Liga', abbreviation: 'LaLiga' },
            { slug: 'uefa.champions', name: 'UEFA Champions League', abbreviation: 'UCL' },
            { slug: 'club.friendly', name: 'Club Friendly' }
          ]
        });
      }

      if (url.includes('/uefa.champions/')) {
        return Promise.resolve(makeSchedule('UEFA Champions League', 'ucl-result'));
      }

      if (url.includes('fixture=true')) {
        return Promise.resolve({ events: [] });
      }

      return Promise.reject(new Error('Team is not in this league'));
    });

    const schedule = await fetchTeamSchedule('uefa.champions', '359', undefined);

    expect(schedule.events?.map((event) => event.id)).toEqual(['ucl-result']);
    expect(requestedUrls.some((url) => url.includes('/eng.1/'))).toBe(true);
    expect(requestedUrls.some((url) => url.includes('/esp.1/'))).toBe(true);
    expect(requestedUrls.some((url) => url.includes('/club.friendly/'))).toBe(false);
  });
});

function makeSchedule(
  leagueName: string,
  eventId: string
): EspnTeamScheduleResponse {
  return {
    events: [makeEvent(eventId, leagueName)]
  };
}

function makeEvent(
  eventId: string,
  seasonDisplayName?: string
): NonNullable<EspnTeamScheduleResponse['events']>[number] {
  return {
    id: eventId,
    date: '2026-05-08T14:00:00Z',
    season: { displayName: seasonDisplayName },
    seasonType: { name: seasonDisplayName },
    status: { type: { state: 'post', completed: true } },
    competitions: [
      {
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { id: '160', displayName: 'PSG', shortDisplayName: 'PSG' }
          },
          {
            homeAway: 'away',
            score: '0',
            team: { id: '2', displayName: 'Opponent', shortDisplayName: 'OPP' }
          }
        ]
      }
    ]
  };
}
