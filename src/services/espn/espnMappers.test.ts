import { describe, expect, it } from 'vitest';
import {
  mapRosterResponse,
  mapPlayerSeasonStatsResponse,
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

  it('uses ESPN summary league slug as the canonical match detail slug', () => {
    const summary = makeScheduledSummary();
    summary.header = {
      ...summary.header,
      league: {
        name: 'UEFA Conference League',
        abbreviation: 'UEFA Conference League',
        slug: 'uefa.europa.conf'
      }
    };

    const detail = mapSummaryResponse(summary, 'eng.fa', '401862929');

    expect(detail.leagueSlug).toBe('uefa.europa.conf');
    expect(detail.leagueName).toBe('UEFA Conference League');
    expect(detail.leagueShortName).toBe('UECL');
  });

  it('falls back to the route league slug when ESPN summary omits league slug', () => {
    const summary = makeScheduledSummary();
    summary.header = {
      ...summary.header,
      league: { name: 'Spanish LALIGA' }
    };

    const detail = mapSummaryResponse(summary, 'esp.1', '748491');

    expect(detail.leagueSlug).toBe('esp.1');
    expect(detail.leagueShortName).toBe('LaLiga');
  });

  it('maps important match labels and penalty shootout scores', () => {
    const summary = makeScheduledSummary();
    summary.header = {
      ...summary.header,
      name: 'UEFA Champions League Semifinal',
      status: { type: { state: 'post', completed: true, detail: 'FT-Pens Arsenal win 4-3 on penalties' } },
      competitions: [
        {
          ...summary.header?.competitions?.[0],
          competitors: [
            {
              homeAway: 'home',
              score: '1',
              shootoutScore: '4',
              team: { id: '359', displayName: 'Arsenal', shortDisplayName: 'Arsenal' }
            },
            {
              homeAway: 'away',
              score: '1',
              shootoutScore: '3',
              team: { id: '83', displayName: 'Barcelona', shortDisplayName: 'Barcelona' }
            }
          ]
        }
      ]
    };

    const detail = mapSummaryResponse(summary, 'uefa.champions', '999');

    expect(detail.importanceLabel).toBe('Bán kết');
    expect(detail.penaltyShootout).toEqual({ home: 4, away: 3 });
  });

  it('maps knockout labels from ESPN summary season names', () => {
    const final = makeScheduledSummary();
    final.header = {
      ...final.header,
      season: { name: '2025-26 English FA Cup, Final' }
    };
    const semifinal = makeScheduledSummary();
    semifinal.header = {
      ...semifinal.header,
      season: { name: '2025-26 English FA Cup, Semifinals' }
    };
    const quarterfinal = makeScheduledSummary();
    quarterfinal.header = {
      ...quarterfinal.header,
      season: { name: '2025-26 English FA Cup, Quarterfinals' }
    };

    expect(mapSummaryResponse(final, 'eng.fa', '401867655').importanceLabel).toBe('Chung kết');
    expect(mapSummaryResponse(semifinal, 'eng.fa', '401867653').importanceLabel).toBe('Bán kết');
    expect(mapSummaryResponse(quarterfinal, 'eng.fa', '401864079').importanceLabel).toBe('Tứ kết');
  });

  it('parses penalty shootout fallback from summary notes', () => {
    const summary = makeScheduledSummary();
    summary.header = {
      ...summary.header,
      competitions: [
        {
          ...summary.header?.competitions?.[0],
          competitors: [
            {
              homeAway: 'home',
              score: '2',
              team: { id: '1', displayName: 'West Ham United', shortDisplayName: 'West Ham' }
            },
            {
              homeAway: 'away',
              score: '2',
              team: { id: '2', displayName: 'Leeds United', shortDisplayName: 'Leeds' }
            }
          ],
          notes: [{ type: 'event', headline: 'Leeds United advance 4-2 on penalties' }]
        }
      ]
    };

    expect(mapSummaryResponse(summary, 'eng.fa', '401864079').penaltyShootout).toEqual({
      home: 4,
      away: 2
    });
  });

  it('maps final labels from scoreboard events', () => {
    const response = makeScoreboard('pre');
    response.events![0].name = 'FIFA World Cup Final';

    const match = mapScoreboardResponse(response, 'fifa.world')[0];

    expect(match.importanceLabel).toBe('Chung kết');
  });

  it('marks penalty, own-goal, and free-kick goals in match events', () => {
    const detail = mapSummaryResponse(makeSummaryWithGoalQualifiers(), 'esp.1', '748480');

    expect(detail.goals.map((goal) => [goal.playerName, goal.goalQualifier])).toEqual([
      ['Robert Lewandowski', 'penalty'],
      ['Jules Kounde', 'own_goal'],
      ['Raphinha', 'free_kick']
    ]);
  });

  it('returns empty events for scheduled summaries without key events', () => {
    const detail = mapSummaryResponse(makeScheduledSummary(), 'esp.1', '748491');

    expect(detail.status).toBe('scheduled');
    expect(detail.kickoff).toBe('2026-05-08T19:00Z');
    expect(detail.events).toEqual([]);
  });

  it('maps team match statistics from summary boxscore', () => {
    const detail = mapSummaryResponse(makeSummaryWithBoxscore(), 'eng.1', '401');

    expect(detail.teamStats).toHaveLength(2);
    expect(detail.teamStats[0]).toMatchObject({
      team: { id: '1', name: 'Arsenal' },
      stats: expect.arrayContaining([{ key: 'possessionpct', label: 'Possession %', displayValue: '61%' }])
    });
    expect(detail.teamStats[1].stats[0].displayValue).toBe('39%');
  });

  it('maps player match statistics from summary boxscore', () => {
    const detail = mapSummaryResponse(makeSummaryWithBoxscore(), 'eng.1', '401');

    expect(detail.playerStats[0]).toMatchObject({
      team: { id: '1', name: 'Arsenal' },
      category: 'Outfield',
      source: 'boxscore',
      labels: ['Shots', 'Goals']
    });
    expect(detail.playerStats[0].players[0]).toMatchObject({
      player: { id: '7', displayName: 'Bukayo Saka' },
      stats: [
        { key: 'shots', displayValue: '3' },
        { key: 'goals', displayValue: '1' }
      ]
    });
  });

  it('falls back to summary leaders when player boxscore stats are missing', () => {
    const detail = mapSummaryResponse(makeSummaryWithLeaders(), 'esp.1', '748480');

    expect(detail.playerStats[0]).toMatchObject({
      team: { id: '97', name: 'Osasuna' },
      category: 'Cau thu noi bat',
      source: 'leaders',
      labels: ['Total Shots', 'Accurate Passes']
    });
    expect(detail.playerStats[0].players).toEqual([
      expect.objectContaining({
        player: expect.objectContaining({ id: '207288', displayName: 'Ante Budimir' }),
        stats: [
          expect.objectContaining({ key: 'totalshots', displayValue: '3' }),
          expect.objectContaining({ key: 'accuratepasses', displayValue: '21' })
        ]
      })
    ]);
  });

  it('maps player season statistics from split categories', () => {
    const stats = mapPlayerSeasonStatsResponse(makePlayerSeasonStatsResponse(), '207288');

    expect(stats.season).toBe('2025');
    expect(stats.groups).toEqual([
      expect.objectContaining({
        name: 'Offensive',
        stats: [
          expect.objectContaining({ key: 'totalgoals', label: 'Goals', displayValue: '12' }),
          expect.objectContaining({ key: 'totalassists', label: 'Assists', displayValue: '3' })
        ]
      })
    ]);
  });

  it('keeps match stats empty when summary boxscore is missing', () => {
    const detail = mapSummaryResponse(makeScheduledSummary(), 'esp.1', '748491');

    expect(detail.teamStats).toEqual([]);
    expect(detail.playerStats).toEqual([]);
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

  it('uses home next event venue for team detail when explicit venue is missing', () => {
    const team = mapTeamDetailResponse(
      {
        team: {
          id: '363',
          displayName: 'Chelsea',
          shortDisplayName: 'Chelsea'
        },
        nextEvent: [
          {
            competitions: [
              {
                neutralSite: false,
                venue: { fullName: 'Stamford Bridge' },
                competitors: [
                  {
                    id: '363',
                    homeAway: 'home',
                    team: { id: '363', displayName: 'Chelsea', shortDisplayName: 'Chelsea' }
                  },
                  {
                    id: '367',
                    homeAway: 'away',
                    team: { id: '367', displayName: 'Tottenham Hotspur', shortDisplayName: 'Spurs' }
                  }
                ]
              }
            ]
          }
        ]
      },
      'eng.1',
      '363'
    );

    expect(team).toMatchObject({
      id: '363',
      name: 'Chelsea',
      venue: 'Stamford Bridge'
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
    const response = makeScoreboard('post', { value: 2 }, 1, true);
    response.events![0].competitions![0].neutralSite = true;
    const matches = mapTeamScheduleResponse(response, 'eng.1');

    expect(matches[0]).toMatchObject({
      id: '401',
      leagueSlug: 'eng.1',
      homeTeam: { name: 'Arsenal' },
      homeScore: 2,
      awayScore: 1,
      neutralSite: true
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

  it('uses event.league over source league for team schedule matches', () => {
    const matches = mapTeamScheduleResponse(
      {
        leagues: [{ slug: 'esp.2', name: 'Spanish LALIGA 2', abbreviation: 'LALIGA 2' }],
        events: [
          {
            id: '401863595',
            date: '2026-08-09T18:00:00Z',
            league: { slug: 'concacaf.leagues.cup', name: 'Leagues Cup', abbreviation: 'Leagues Cup' },
            sourceLeague: { slug: 'esp.2', name: 'Spanish LALIGA 2', abbreviation: 'LALIGA 2' },
            competitions: [
              {
                competitors: [
                  {
                    homeAway: 'home',
                    team: { id: '20232', displayName: 'Inter Miami CF', shortDisplayName: 'Miami' }
                  },
                  {
                    homeAway: 'away',
                    team: { id: '220', displayName: 'Monterrey', shortDisplayName: 'Monterrey' }
                  }
                ]
              }
            ]
          }
        ]
      },
      'esp.2'
    );

    expect(matches[0]).toMatchObject({
      id: '401863595',
      leagueSlug: 'concacaf.leagues.cup',
      leagueName: 'Leagues Cup',
      leagueShortName: 'Leagues Cup'
    });
  });

  it('uses event links over source league for team schedule matches', () => {
    const matches = mapTeamScheduleResponse(
      {
        leagues: [{ slug: 'esp.2', name: 'Spanish LALIGA 2', abbreviation: 'LALIGA 2' }],
        events: [
          {
            id: '401863595',
            date: '2026-08-09T18:00:00Z',
            links: [
              {
                href: 'sportscenter://x-callback-url/showGame?sportName=soccer&leagueAbbrev=concacaf.leagues.cup&gameId=401863595'
              }
            ],
            sourceLeague: { slug: 'esp.2', name: 'Spanish LALIGA 2', abbreviation: 'LALIGA 2' },
            competitions: [{ competitors: [] }]
          }
        ]
      },
      'esp.2'
    );

    expect(matches[0].leagueSlug).toBe('concacaf.leagues.cup');
  });

  it('infers Leagues Cup from event season text before using source league', () => {
    const matches = mapTeamScheduleResponse(
      {
        leagues: [{ slug: 'esp.2', name: 'Spanish LALIGA 2', abbreviation: 'LALIGA 2' }],
        events: [
          {
            id: '401863595',
            date: '2026-08-09T18:00:00Z',
            season: { displayName: '2026 Leagues Cup' },
            seasonType: { name: 'League Phase' },
            sourceLeague: { slug: 'esp.2', name: 'Spanish LALIGA 2', abbreviation: 'LALIGA 2' },
            competitions: [{ competitors: [] }]
          }
        ]
      },
      'esp.2'
    );

    expect(matches[0].leagueSlug).toBe('concacaf.leagues.cup');
  });

  it('uses source league only when no event-level league metadata is available', () => {
    const matches = mapTeamScheduleResponse(
      {
        leagues: [{ slug: 'esp.2', name: 'Spanish LALIGA 2', abbreviation: 'LALIGA 2' }],
        events: [
          {
            id: '801',
            date: '2026-08-09T18:00:00Z',
            sourceLeague: { slug: 'esp.2', name: 'Spanish LALIGA 2', abbreviation: 'LALIGA 2' },
            competitions: [{ competitors: [] }]
          }
        ]
      },
      'esp.2'
    );

    expect(matches[0].leagueSlug).toBe('esp.2');
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

function makeSummaryWithGoalQualifiers(): EspnSummaryResponse {
  return {
    ...makeScheduledSummary(),
    keyEvents: [
      {
        id: 'goal-penalty',
        type: { type: 'goal---penalty', text: 'Penalty - Scored' },
        scoringPlay: true,
        clock: { value: 1200, displayValue: "20'" },
        team: { id: '83', displayName: 'Barcelona' },
        participants: [{ athlete: { id: '125824', displayName: 'Robert Lewandowski' } }],
        text: 'Robert Lewandowski converts the penalty.'
      },
      {
        id: 'goal-own-goal',
        type: { type: 'goal---own-goal', text: 'Own Goal' },
        scoringPlay: true,
        clock: { value: 1800, displayValue: "30'" },
        team: { id: '86', displayName: 'Real Madrid' },
        participants: [{ athlete: { id: '675', displayName: 'Jules Kounde' } }],
        text: 'Jules Kounde own goal.'
      },
      {
        id: 'goal-free-kick',
        type: { type: 'goal---free-kick', text: 'Goal - Free Kick' },
        scoringPlay: true,
        clock: { value: 2400, displayValue: "40'" },
        team: { id: '83', displayName: 'Barcelona' },
        participants: [{ athlete: { id: '129740', displayName: 'Raphinha' } }],
        text: 'Raphinha scores from a free kick.'
      }
    ]
  };
}

function makeSummaryWithBoxscore(): EspnSummaryResponse {
  return {
    ...makeScheduledSummary(),
    boxscore: {
      teams: [
        {
          team: { id: '1', displayName: 'Arsenal', shortDisplayName: 'Arsenal' },
          statistics: [
            { name: 'possessionPct', displayName: 'Possession %', displayValue: '61%' },
            { name: 'shotsOnTarget', displayName: 'Shots on Target', value: 8 }
          ]
        },
        {
          team: { id: '2', displayName: 'Chelsea', shortDisplayName: 'Chelsea' },
          statistics: [
            { name: 'possessionPct', displayName: 'Possession %', displayValue: '39%' },
            { name: 'shotsOnTarget', displayName: 'Shots on Target', value: 4 }
          ]
        }
      ],
      players: [
        {
          team: { id: '1', displayName: 'Arsenal', shortDisplayName: 'Arsenal' },
          statistics: [
            {
              name: 'outfield',
              displayName: 'Outfield',
              labels: ['Shots', 'Goals'],
              keys: ['shots', 'goals'],
              athletes: [
                {
                  athlete: { id: '7', displayName: 'Bukayo Saka' },
                  stats: [3, 1]
                }
              ]
            }
          ]
        }
      ]
    }
  };
}

function makeSummaryWithLeaders(): EspnSummaryResponse {
  return {
    ...makeScheduledSummary(),
    leaders: [
      {
        team: { id: '97', displayName: 'Osasuna', shortDisplayName: 'Osasuna' },
        leaders: [
          {
            name: 'totalShots',
            displayName: 'Total Shots',
            leaders: [
              {
                displayValue: '3',
                athlete: { id: '207288', displayName: 'Ante Budimir' },
                statistics: [
                  { name: 'totalShots', displayName: 'Shots', displayValue: '3' }
                ]
              }
            ]
          },
          {
            name: 'accuratePasses',
            displayName: 'Accurate Passes',
            leaders: [
              {
                athlete: { id: '207288', displayName: 'Ante Budimir' },
                mainStat: { value: '21', label: 'Passes' }
              }
            ]
          }
        ]
      }
    ]
  };
}

function makePlayerSeasonStatsResponse() {
  return {
    season: { displayName: '2025' },
    splits: {
      categories: [
        {
          name: 'offensive',
          displayName: 'Offensive',
          stats: [
            { name: 'totalGoals', displayName: 'Goals', displayValue: '12' },
            { name: 'totalAssists', displayName: 'Assists', value: 3 }
          ]
        }
      ]
    }
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
