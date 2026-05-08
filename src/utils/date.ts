const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function toDateParam(date: string): string {
  return date.split('-').join('');
}

export function toInputDate(date: Date): string {
  return getVietnamDateKeyFromDate(date);
}

export function addDays(inputDate: string, days: number): string {
  const [year, month, day] = inputDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return getVietnamDateKeyFromDate(date);
}

export function getTodayInputDate(now = new Date()): string {
  return getVietnamDateKeyFromDate(now);
}

export function getRelativeDateLabel(inputDate: string, today = getTodayInputDate()): string {
  if (inputDate === today) {
    return 'Hôm nay';
  }

  if (inputDate === addDays(today, -1)) {
    return 'Hôm qua';
  }

  if (inputDate === addDays(today, 1)) {
    return 'Ngày mai';
  }

  return formatVietnamDate(inputDate);
}

export function getResultDateRange(dayCount: number, today = getTodayInputDate()): string[] {
  return Array.from({ length: Math.max(dayCount, 1) }, (_, index) => addDays(today, -index));
}

export function getFixtureDateRange(dayCount: number, today = getTodayInputDate()): string[] {
  return Array.from({ length: Math.max(dayCount, 1) }, (_, index) => addDays(today, index));
}

export function getScoreboardSourceDateRange(targetDates: string[]): string[] {
  const sourceDates = new Set<string>();

  for (const targetDate of targetDates) {
    sourceDates.add(addDays(targetDate, -1));
    sourceDates.add(targetDate);
  }

  return Array.from(sourceDates).sort();
}

export function getVietnamDateKeyFromIso(isoDate: string): string {
  if (!isoDate) {
    return '';
  }

  return getVietnamDateKeyFromDate(new Date(isoDate));
}

export function formatKickoffTime(isoDate: string): string {
  if (!isoDate) {
    return 'TBD';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: VIETNAM_TIME_ZONE
  }).format(new Date(isoDate));
}

export function formatKickoffDate(isoDate: string): string {
  if (!isoDate) {
    return 'TBD';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: VIETNAM_TIME_ZONE
  }).format(new Date(isoDate));
}

export function formatKickoffDateTime(isoDate: string): string {
  if (!isoDate) {
    return 'TBD';
  }

  return `${formatKickoffTime(isoDate)}, ${formatKickoffDate(isoDate)}`;
}

export function formatVietnamDate(inputDate: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: VIETNAM_TIME_ZONE
  }).format(new Date(`${inputDate}T00:00:00+07:00`));
}

function getVietnamDateKeyFromDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: VIETNAM_TIME_ZONE
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';

  return `${year}-${month}-${day}`;
}
