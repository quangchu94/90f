import type { MatchStatus } from './models';

export const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: 'Sắp tới',
  in_progress: 'Đang đá',
  halftime: 'Nghỉ giữa hiệp',
  finished: 'Kết thúc',
  postponed: 'Hoãn',
  cancelled: 'Hủy',
  unknown: 'Chưa rõ'
};

export function isLiveStatus(status: MatchStatus): boolean {
  return status === 'in_progress' || status === 'halftime';
}

export function isResultStatus(status: MatchStatus): boolean {
  return status === 'finished';
}

export function isUpcomingStatus(status: MatchStatus): boolean {
  return status === 'scheduled';
}
