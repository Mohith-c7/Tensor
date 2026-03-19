import type { AttendanceRecord } from '../types/api';

/**
 * Calculate attendance percentage from records.
 * Counts present + late as attended, clamped to [0, 100].
 * Requirements: 7.8
 */
export function calculatePercentage(records: AttendanceRecord[]): number {
  if (records.length === 0) return 0;
  const attended = records.filter(r => r.status === 'present' || r.status === 'late').length;
  const percentage = (attended / records.length) * 100;
  return Math.min(100, Math.max(0, percentage));
}
