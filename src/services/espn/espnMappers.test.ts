import { describe, expect, it } from 'vitest';
import { mapScoreboardResponse, mapSummaryResponse, normalizeStatus } from './espnMappers';
import type { EspnScoreboardResponse, EspnSummaryResponse } from './espnTypes';

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
});

function makeScoreboard(
  state: string,
  homeScore = '',
  awayScore = '',
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
