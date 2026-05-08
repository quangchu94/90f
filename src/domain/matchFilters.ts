import type { FootballMatch } from './models';
import { isResultStatus, isUpcomingStatus } from './status';
import { getVietnamDateKeyFromIso } from '@/utils/date';

export function isMatchOnVietnamDate(match: FootballMatch, date: string): boolean {
  return getVietnamDateKeyFromIso(match.kickoff) === date;
}

export function filterMatchesForModeDate(
  matches: FootballMatch[],
  mode: 'results' | 'fixtures',
  date: string
): FootballMatch[] {
  return matches
    .filter((match) => isMatchOnVietnamDate(match, date))
    .filter((match) => (mode === 'results' ? isResultStatus(match.status) : isUpcomingStatus(match.status)));
}

export function dedupeMatchesById(matches: FootballMatch[]): FootballMatch[] {
  const byId = new Map<string, FootballMatch>();

  for (const match of matches) {
    byId.set(match.id, match);
  }

  return Array.from(byId.values());
}
