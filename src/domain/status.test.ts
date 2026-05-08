import { describe, expect, it } from 'vitest';
import { isResultStatus, isUpcomingStatus } from './status';

describe('status helpers', () => {
  it('keeps finished matches only in results', () => {
    expect(isResultStatus('finished')).toBe(true);
    expect(isResultStatus('scheduled')).toBe(false);
    expect(isResultStatus('in_progress')).toBe(false);
  });

  it('keeps scheduled matches only in fixtures', () => {
    expect(isUpcomingStatus('scheduled')).toBe(true);
    expect(isUpcomingStatus('finished')).toBe(false);
    expect(isUpcomingStatus('halftime')).toBe(false);
  });
});
