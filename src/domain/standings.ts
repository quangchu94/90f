import type { StandingRow } from './models';

export function sortStandingRowsByRank(rows: StandingRow[]): StandingRow[] {
  return rows
    .map((row, originalIndex) => ({ row, originalIndex }))
    .sort((left, right) => compareStandingRows(left.row, right.row, left.originalIndex, right.originalIndex))
    .map(({ row }) => row);
}

function compareStandingRows(
  left: StandingRow,
  right: StandingRow,
  leftIndex: number,
  rightIndex: number
): number {
  if (left.rank !== undefined && right.rank !== undefined) {
    const rankDiff = left.rank - right.rank;
    return rankDiff === 0 ? leftIndex - rightIndex : rankDiff;
  }

  if (left.rank !== undefined) {
    return -1;
  }

  if (right.rank !== undefined) {
    return 1;
  }

  return leftIndex - rightIndex;
}
