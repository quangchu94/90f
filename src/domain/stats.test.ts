import { describe, expect, it } from 'vitest';
import { formatStatDisplayValue } from './stats';

describe('formatStatDisplayValue', () => {
  it('formats decimal percent stats as whole percentages', () => {
    expect(formatStatDisplayValue({ key: 'passPct', label: 'Pass %', displayValue: '0.72' })).toBe('72%');
  });

  it('keeps whole percent stats as percentages', () => {
    expect(formatStatDisplayValue({ key: 'possessionpct', label: 'Possession %', displayValue: '72.0' })).toBe('72%');
  });

  it('does not change non-percent stats', () => {
    expect(formatStatDisplayValue({ key: 'goals', label: 'Goals', displayValue: '2' })).toBe('2');
  });
});
