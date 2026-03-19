import type { LetterGrade } from '../types/api';

/**
 * Calculate letter grade based on marks obtained vs max marks.
 * A ≥ 90%, B ≥ 75%, C ≥ 60%, D ≥ 45%, F < 45%
 * Requirements: 9.11
 */
export function calculateGrade(marksObtained: number, maxMarks: number): LetterGrade {
  if (maxMarks <= 0) return 'F';
  const percentage = (marksObtained / maxMarks) * 100;
  if (percentage >= 90) return 'A';
  if (percentage >= 75) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 45) return 'D';
  return 'F';
}
