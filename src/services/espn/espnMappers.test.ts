import { describe, expect, it } from 'vitest';
import {
  mapRosterResponse,
  mapScoreboardResponse,
  mapStandingsResponse,
  mapSummaryResponse,
  mapTeamDetailResponse,
  mapTeamScheduleResponse,
  mapTeamsResponse,
  normalizeStatus
} from './espnMappers';
import type {
  EspnRosterResponse,
  EspnScoreboardResponse,
  EspnStandingsResponse,
  EspnSummaryResponse,
  EspnTeamScheduleResponse,
  EspnTeamsResponse
} from './espnTypes';

describe('espn mappers', () => {
  it('maps scheduled matches without scores', () => {
    const matches = mapScoreboardResponse(makeScoreboard('pre'), 'eng.1');

    expect(matches[0]).toMatchObject({
      id: '401',
      status: 'scheduled',
      homeScore: undefined,
      awayScore: undefined,
      homeTeam: { name: 'Arsenal' },
      awayTeam: { name: 'Chelsea' }
    });
  });

  it('maps live and finished scores', () => {
    const live = mapScoreboardResponse(makeScoreboard('in', '1', '2'), 'eng.1');
    const finished = mapScoreboardResponse(makeScoreboard('post', '3', '0', true), 'eng.1');

    expect(live[0].status).toBe('in_progress');
    expect(live[0].homeScore).toBe(1);
    expect(finished[0].status).toBe('finished');
    expect(finished[0].awayScore).toBe(0);
  });

  it('handles missing logos and venue', () => {
    const response = makeScoreboard('pre');
    delete response.events?.[0]?.competitions?.[0]?.venue;
    delete response.events?.[0]?.competitions?.[0]?.competitors?.[0]?.team?.logo;

    const match = mapScoreboardResponse(response, 'eng.1')[0];

    expect(match.venue).toBeUndefined();
    expect(match.homeTeam.logoUrl).toBeUndefined();
  });

  it('normalizes postponed and unknown statuses', () => {
    expect(normalizeStatus({ type: { id: '6', description: 'Postponed' } })).toBe('postponed');
    expect(normalizeStatus({ type: { state: 'mystery' } })).toBe('unknown');
    expect(normalizeStatus({ type: { state: 'mystery' } }, true)).toBe('finished');
  });

  it('maps summary goal and red-card key events', () => {
    const detail = mapSummaryResponse(makeSummaryWithEvents(), 'esp.1', '748480');

    expect(detail.goals[0]).toMatchObject({
      type: 'goal',
      playerName: 'Robert Lewandowski',
      teamName: 'Barcelona',
      displayMinute: "81'"
    });
    expect(detail.redCards[0]).toMatchObject({
      type: 'red_card',
      playerName: 'Eduardo Camavinga',
      teamName: 'Real Madrid',
      displayMinute: "86'"
    });
    expect(detail.events).toHaveLength(2);
  });

  it('returns empty events for scheduled summaries without key events', () => {
    const detail = mapSummaryResponse(makeScheduledSummary(), 'esp.1', '748491');

    expect(detail.status).toBe('scheduled');
    expect(detail.kickoff).toBe('2026-05-08T19:00Z');
    expect(detail.events).toEqual([]);
  });

  it('maps standings rows with common soccer stats', () => {
    const groups = mapStandingsResponse(makeStandings());

    expect(groups[0].rows[0]).toMatchObject({
      rank: 1,
      team: { name: 'Arsenal' },
      played: 38,
      wins: 28,
      draws: 6,
      losses: 4,
      goalDifference: 62,
      points: 90
    });
  });

  it('sorts standings rows by ESPN rank and keeps unranked rows last', () => {
    const groups = mapStandingsResponse({
      standings: {
        entries: [
          makeStandingEntry('4', 'Fourth', 4),
          makeStandingEntry('1', 'First', 1),
          makeStandingEntry('x', 'Unranked'),
          makeStandingEntry('3', 'Third', 3),
          makeStandingEntry('2', 'Second', 2)
        ]
      }
    });

    expect(groups[0].rows.map((row) => row.team.name)).toEqual([
      'First',
      'Second',
      'Third',
      'Fourth',
      'Unranked'
    ]);
    expect(groups[0].rows.map((row) => row.rank)).toEqual([1, 2, 3, 4, undefined]);
  });

  it('places rank four right after rank one when ranks two and three are missing', () => {
    const groups = mapStandingsResponse({
      standings: {
        entries: [
          makeStandingEntry('4', 'Fourth', 4),
          makeStandingEntry('1', 'First', 1)
        ]
      }
    });

    expect(groups[0].rows.map((row) => row.rank)).toEqual([1, 4]);
  });

  it('parses standings rank from ordinal display values', () => {
    const groups = mapStandingsResponse({
      standings: {
        entries: [
          makeStandingEntry('4', 'Fourth', undefined, '4th'),
          makeStandingEntry('1', 'First', undefined, '1st')
        ]
      }
    });

    expect(groups[0].rows.map((row) => row.rank)).toEqual([1, 4]);
    expect(groups[0].rows.map((row) => row.team.name)).toEqual(['First', 'Fourth']);
  });

  it('maps grouped standings', () => {
    const groups = mapStandingsResponse({
      children: [{ id: 'a', name: 'Group A', standings: makeStandings().standings }]
    });

    expect(groups[0].name).toBe('Group A');
    expect(groups[0].rows).toHaveLength(1);
  });

  it('maps teams and missing logos safely', () => {
    const teams = mapTeamsResponse(makeTeams(), 'eng.1');

    expect(teams[0]).toMatchObject({
      id: '359',
      leagueSlug: 'eng.1',
      name: 'Arsenal',
      logoUrl: undefined
    });
  });

  it('maps core team detail venue fields', () => {
    const team = mapTeamDetailResponse(
      {
        id: '359',
        displayName: 'Arsenal',
        shortDisplayName: 'Arsenal',
        venue: { fullName: 'Emirates Stadium' }
      },
      'eng.1',
      '359'
    );

    expect(team).toMatchObject({
      id: '359',
      name: 'Arsenal',
      venue: 'Emirates Stadium'
    });
  });

  it('maps roster groups with fallback positions', () => {
    const roster = mapRosterResponse(makeRoster());

    expect(roster[0]).toMatchObject({
      displayName: 'Bukayo Saka',
      jersey: '7',
      position: 'Forward',
      headshotUrl: 'saka-alt.png'
    });
  });

  it('maps team schedule through normalized match models', () => {
    const matches = mapTeamScheduleResponse(makeScoreboard('post', { value: 2 }, 1, true), 'eng.1');

    expect(matches[0]).toMatchObject({
      id: '401',
      leagueSlug: 'eng.1',
      homeTeam: { name: 'Arsenal' },
      homeScore: 2,
      awayScore: 1
    });
  });

  it('keeps per-match league information in team schedules', () => {
    const matches = mapTeamScheduleResponse(makeMultiLeagueSchedule(), 'fra.1');

    expect(matches.map((match) => [match.id, match.leagueSlug, match.leagueName])).toEqual([
      ['501', 'fra.1', 'French Ligue 1'],
      ['601', 'uefa.champions', 'UEFA Champions League']
    ]);
    expect(matches.map((match) => match.leagueShortName)).toEqual(['Ligue 1', 'UCL']);
  });

  it('dedupes team schedule matches and keeps the more complete event', () => {
    const matches = mapTeamScheduleResponse(makeDuplicateSchedule(), 'fra.1');

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      id: '701',
      leagueSlug: 'uefa.champions',
      leagueName: 'UEFA Champions League',
      homeScore: 2,
      awayScore: 1,
      venue: 'Parc des Princes'
    });
  });

  it('marks scored matches as finished when ESPN status is unknown', () => {
    const matches = mapTeamScheduleResponse(makeScoreboard('unknown', '2', '1'), 'eng.1');

    expect(matches[0]).toMatchObject({
      status: 'finished',
      homeScore: 2,
      awayScore: 1
    });
  });
});

function makeStandingEntry(id: string, name: string, rank?: number, rankDisplayValue?: string) {
  return {
    team: { id, displayName: name, shortDisplayName: name },
    stats: rank === undefined && rankDisplayValue === undefined
      ? []
      : [{ name: 'rank', value: rank, displayValue: rankDisplayValue }]
  };
}

function makeScoreboard(
  state: string,
  homeScore: string | number | { value?: number; displayValue?: string } = '',
  awayScore: string | number | { value?: number; displayValue?: string } = '',
  completed = false
): EspnScoreboardResponse {
  return {
    leagues: [{ name: 'Premier League', slug: 'eng.1' }],
    events: [
      {
        id: '401',
        date: '2026-05-08T14:00:00Z',
        status: { type: { state, completed, shortDetail: '90\'' } },
        competitions: [
          {
            venue: { fullName: 'Emirates Stadium' },
            competitors: [
              {
                homeAway: 'home',
                score: homeScore,
                team: { id: '1', displayName: 'Arsenal', shortDisplayName: 'Arsenal', logo: 'arsenal.png' }
              },
              {
                homeAway: 'away',
                score: awayScore,
                team: { id: '2', displayName: 'Chelsea', shortDisplayName: 'Chelsea' }
              }
            ]
          }
        ]
      }
    ]
  };
}

function makeMultiLeagueSchedule(): EspnTeamScheduleResponse {
  return {
    events: [
      {
        id: '501',
        date: '2026-05-08T14:00:00Z',
        leagues: [{ slug: 'fra.1', name: 'French Ligue 1' }],
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
                team: { id: '2', displayName: 'Monaco', shortDisplayName: 'Monaco' }
              }
            ]
          }
        ]
      },
      {
        id: '601',
        date: '2026-05-09T19:00:00Z',
        leagues: [{ slug: 'uefa.champions', name: 'UEFA Champions League' }],
        status: { type: { state: 'pre', description: 'Scheduled' } },
        competitions: [
          {
            competitors: [
              {
                homeAway: 'home',
                team: { id: '160', displayName: 'PSG', shortDisplayName: 'PSG' }
              },
              {
                homeAway: 'away',
                team: { id: '86', displayName: 'Real Madrid', shortDisplayName: 'Real Madrid' }
              }
            ]
          }
        ]
      }
    ]
  };
}

function makeDuplicateSchedule(): EspnTeamScheduleResponse {
  return {
    leagues: [{ slug: 'fra.1', name: 'French Ligue 1' }],
    events: [
      {
        id: '701',
        date: '2026-05-07T14:00:00Z',
        status: { type: { state: 'post', completed: true } },
        competitions: [
          {
            competitors: [
              {
                homeAway: 'home',
                team: { id: '160', displayName: 'PSG', shortDisplayName: 'PSG' }
              },
              {
                homeAway: 'away',
                team: { id: '2', displayName: 'Opponent', shortDisplayName: 'OPP' }
              }
            ]
          }
        ]
      },
      {
        id: '701',
        date: '2026-05-07T14:00:00Z',
        leagues: [{ slug: 'uefa.champions', name: 'UEFA Champions League' }],
        status: { type: { state: 'post', completed: true } },
        competitions: [
          {
            venue: { fullName: 'Parc des Princes' },
            competitors: [
              {
                homeAway: 'home',
                score: '2',
                team: {
                  id: '160',
                  displayName: 'PSG',
                  shortDisplayName: 'PSG',
                  logo: 'psg.png'
                }
              },
              {
                homeAway: 'away',
                score: '1',
                team: { id: '86', displayName: 'Real Madrid', shortDisplayName: 'Real Madrid' }
              }
            ]
          }
        ]
      }
    ]
  };
}

function makeScheduledSummary(): EspnSummaryResponse {
  return {
    header: {
      id: '748491',
      league: { name: 'Spanish LALIGA', slug: 'esp.1' },
      competitions: [
        {
          date: '2026-05-08T19:00Z',
          status: { type: { state: 'pre', description: 'Scheduled' } },
          competitors: [
            {
              homeAway: 'home',
              team: { id: '1538', displayName: 'Levante', shortDisplayName: 'Levante' }
            },
            {
              homeAway: 'away',
              team: { id: '97', displayName: 'Osasuna', shortDisplayName: 'Osasuna' }
            }
          ]
        }
      ]
    }
  };
}

function makeSummaryWithEvents(): EspnSummaryResponse {
  return {
    ...makeScheduledSummary(),
    keyEvents: [
      {
        id: 'goal-1',
        type: { type: 'goal---header', text: 'Goal - Header' },
        scoringPlay: true,
        clock: { value: 4821, displayValue: "81'" },
        team: { id: '83', displayName: 'Barcelona' },
        participants: [{ athlete: { id: '125824', displayName: 'Robert Lewandowski' } }],
        text: 'Goal! Osasuna 0, Barcelona 1.'
      },
      {
        id: 'red-1',
        type: { type: 'red-card', text: 'Red Card' },
        clock: { value: 5160, displayValue: "86'" },
        team: { id: '86', displayName: 'Real Madrid' },
        participants: [{ athlete: { id: '124562', displayName: 'Eduardo Camavinga' } }],
        text: 'Eduardo Camavinga is shown the red card.'
      }
    ]
  };
}

function makeStandings(): EspnStandingsResponse {
  return {
    standings: {
      entries: [
        {
          team: { id: '359', displayName: 'Arsenal', shortDisplayName: 'Arsenal' },
          stats: [
            { name: 'rank', value: 1 },
            { name: 'gamesPlayed', value: 38 },
            { name: 'wins', value: 28 },
            { name: 'ties', value: 6 },
            { name: 'losses', value: 4 },
            { name: 'differential', value: 62 },
            { name: 'points', value: 90 }
          ]
        }
      ]
    }
  };
}

function makeTeams(): EspnTeamsResponse {
  return {
    sports: [
      {
        leagues: [
          {
            teams: [
              {
                team: {
                  id: '359',
                  displayName: 'Arsenal',
                  shortDisplayName: 'Arsenal',
                  abbreviation: 'ARS'
                }
              }
            ]
          }
        ]
      }
    ]
  };
}

function makeRoster(): EspnRosterResponse {
  return {
    athletes: [
      {
        position: 'Forward',
        items: [
          {
            id: '1',
            displayName: 'Bukayo Saka',
            jersey: '7',
            headshots: [{ href: 'saka-alt.png' }]
          }
        ]
      }
    ]
  };
}
