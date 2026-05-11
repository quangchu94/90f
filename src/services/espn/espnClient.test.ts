import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTeamSchedule, espnHttpClient } from './espnClient';
import type { EspnTeamScheduleResponse } from './espnTypes';

describe('espn client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('merges team schedules from supported leagues and all-fixture endpoint', async () => {
    vi.spyOn(espnHttpClient, 'getJson').mockImplementation((url: string) => {
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
    const allFixtureEvent = schedule.events?.find(
      (event, index) => event.id === 'shared-fixture' && index > 0
    );

    expect(allFixtureEvent?.leagues?.[0]).toMatchObject({
      slug: 'uefa.champions',
      name: 'UEFA Champions League'
    });
  });

  it('does not fallback unsupported all-fixture events to the route league', async () => {
    vi.spyOn(espnHttpClient, 'getJson').mockImplementation((url: string) => {
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
