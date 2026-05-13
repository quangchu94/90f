import type { StatSummary } from './models';

export function formatStatDisplayValue(stat: StatSummary): string {
  if (!isPercentStat(stat)) {
    return stat.displayValue;
  }

  const parsed = parseNumericStatValue(stat.displayValue) ?? stat.value;
  if (parsed === undefined || !Number.isFinite(parsed)) {
    return stat.displayValue;
  }

  const percentValue = Math.abs(parsed) <= 1 ? parsed * 100 : parsed;
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(percentValue)}%`;
}

function isPercentStat(stat: StatSummary): boolean {
  const text = [stat.key, stat.label, stat.abbreviation, stat.displayValue].filter(Boolean).join(' ').toLowerCase();
  return text.includes('%') || text.includes('percent') || text.includes('percentage') || /\bpct\b/.test(text);
}

function parseNumericStatValue(value: string): number | undefined {
  const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return undefined;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}
