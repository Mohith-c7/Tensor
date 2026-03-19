import { z } from 'zod';

export const feeStructureSchema = z.object({
  classId: z.number({ required_error: 'Class is required' }).int().positive('Class is required'),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'),
  tuitionFee: z.number({ required_error: 'Tuition fee is required' }).positive('Tuition fee must be positive'),
  transportFee: z.number().nonnegative('Transport fee must be non-negative').default(0),
  activityFee: z.number().nonnegative('Activity fee must be non-negative').default(0),
  otherFee: z.number().nonnegative('Other fee must be non-negative').default(0),
});

export const paymentSchema = z.object({
  studentId: z.number({ required_error: 'Student is required' }).int().positive('Student is required'),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'),
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be greater than zero'),
  paymentDate: z
    .string()
    .min(1, 'Payment date is required')
    .refine((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      return date <= new Date();
    }, 'Payment date cannot be in the future'),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'cheque', 'online'], {
    required_error: 'Payment method is required',
  }),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
});

export type FeeStructureFormData = z.infer<typeof feeStructureSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
