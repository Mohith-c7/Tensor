import type { FeeStructure, FeePayment } from '../types/api';

/**
 * Calculate total fee from all components of a fee structure.
 * Requirements: 8.3
 */
export function calculateTotalFee(structure: FeeStructure): number {
  return structure.tuitionFee + structure.transportFee + structure.activityFee + structure.otherFee;
}

/**
 * Calculate outstanding balance: totalFee - sum(payments), floored at 0.
 * Requirements: 8.3, 8.9
 */
export function calculateOutstanding(structure: FeeStructure, payments: FeePayment[]): number {
  const totalFee = calculateTotalFee(structure);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  return Math.max(0, totalFee - totalPaid);
}
