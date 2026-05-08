import { describe, expect, it } from 'vitest';
import {
  addDays,
  formatKickoffDate,
  formatKickoffTime,
  getFixtureDateRange,
  getRelativeDateLabel,
  getResultDateRange,
  getScoreboardSourceDateRange,
  getTodayInputDate,
  getVietnamDateKeyFromIso,
  toDateParam
} from './date';

describe('date utils', () => {
  it('formats ESPN date params', () => {
    expect(toDateParam('2026-05-08')).toBe('20260508');
  });

  it('labels relative dates in Vietnamese', () => {
    expect(getRelativeDateLabel('2026-05-08', '2026-05-08')).toBe('Hôm nay');
    expect(getRelativeDateLabel('2026-05-07', '2026-05-08')).toBe('Hôm qua');
    expect(getRelativeDateLabel('2026-05-09', '2026-05-08')).toBe('Ngày mai');
  });

  it('adds days to input dates', () => {
    expect(addDays('2026-05-08', 1)).toBe('2026-05-09');
  });

  it('formats kickoff date and time in GMT+7', () => {
    expect(formatKickoffTime('2026-05-08T19:00Z')).toBe('02:00');
    expect(formatKickoffDate('2026-05-08T19:00Z')).toBe('09/05/2026');
    expect(getVietnamDateKeyFromIso('2026-05-08T19:00Z')).toBe('2026-05-09');
  });

  it('uses Vietnam timezone for today key', () => {
    expect(getTodayInputDate(new Date('2026-05-08T18:00:00Z'))).toBe('2026-05-09');
  });

  it('creates result and fixture date ranges around today', () => {
    expect(getResultDateRange(2, '2026-05-08')).toEqual(['2026-05-08', '2026-05-07']);
    expect(getResultDateRange(3, '2026-05-08')).toEqual([
      '2026-05-08',
      '2026-05-07',
      '2026-05-06'
    ]);
    expect(getFixtureDateRange(2, '2026-05-08')).toEqual(['2026-05-08', '2026-05-09']);
    expect(getFixtureDateRange(3, '2026-05-08')).toEqual([
      '2026-05-08',
      '2026-05-09',
      '2026-05-10'
    ]);
  });

  it('creates expanded scoreboard source dates for local-date grouping', () => {
    expect(getScoreboardSourceDateRange(['2026-05-08', '2026-05-09'])).toEqual([
      '2026-05-07',
      '2026-05-08',
      '2026-05-09'
    ]);
  });
});
