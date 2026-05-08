import { describe, expect, it } from 'vitest';
import type { FootballMatch } from './models';
import { filterMatchesForModeDate, isMatchOnVietnamDate } from './matchFilters';

describe('match filters', () => {
  it('groups matches by kickoff date in GMT+7', () => {
    const match = makeMatch({
      kickoff: '2026-05-08T19:00Z',
      status: 'scheduled'
    });

    expect(isMatchOnVietnamDate(match, '2026-05-08')).toBe(false);
    expect(isMatchOnVietnamDate(match, '2026-05-09')).toBe(true);
  });

  it('filters result and fixture matches by local date and status', () => {
    const scheduledTomorrow = makeMatch({
      id: '748491',
      kickoff: '2026-05-08T19:00Z',
      status: 'scheduled'
    });
    const finishedToday = makeMatch({
      id: 'finished-today',
      kickoff: '2026-05-08T10:00Z',
      status: 'finished'
    });

    expect(filterMatchesForModeDate([scheduledTomorrow, finishedToday], 'fixtures', '2026-05-09')).toEqual([
      scheduledTomorrow
    ]);
    expect(filterMatchesForModeDate([scheduledTomorrow, finishedToday], 'results', '2026-05-08')).toEqual([
      finishedToday
    ]);
  });
});

function makeMatch(overrides: Partial<FootballMatch>): FootballMatch {
  return {
    id: '401',
    leagueSlug: 'esp.1',
    leagueName: 'Spanish LALIGA',
    kickoff: '2026-05-08T19:00Z',
    status: 'scheduled',
    statusText: 'Scheduled',
    homeTeam: { id: '1538', name: 'Levante', shortName: 'Levante' },
    awayTeam: { id: '97', name: 'Osasuna', shortName: 'Osasuna' },
    ...overrides
  };
}
