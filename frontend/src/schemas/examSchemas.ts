import { z } from 'zod';

export const examSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Exam name must be at least 3 characters')
      .max(200, 'Exam name must be at most 200 characters'),
    examType: z.enum(['unit_test', 'mid_term', 'final', 'practical'], {
      required_error: 'Exam type is required',
    }),
    classId: z.number({ required_error: 'Class is required' }).int().positive('Class is required'),
    subject: z
      .string()
      .min(2, 'Subject must be at least 2 characters')
      .max(100, 'Subject must be at most 100 characters'),
    maxMarks: z
      .number({ required_error: 'Max marks is required' })
      .int('Max marks must be a whole number')
      .positive('Max marks must be positive'),
    passingMarks: z
      .number({ required_error: 'Passing marks is required' })
      .int('Passing marks must be a whole number')
      .positive('Passing marks must be positive'),
    examDate: z.string().min(1, 'Exam date is required'),
  })
  .refine((data) => data.passingMarks <= data.maxMarks, {
    message: 'Passing marks cannot exceed max marks',
    path: ['passingMarks'],
  });

export const marksEntrySchema = z
  .object({
    marksObtained: z.number().nonnegative('Marks cannot be negative').optional(),
    isAbsent: z.boolean(),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isAbsent) {
        return data.marksObtained === undefined || data.marksObtained === 0;
      }
      return true;
    },
    {
      message: 'Marks must be 0 or empty when student is absent',
      path: ['marksObtained'],
    }
  );

export type ExamFormData = z.infer<typeof examSchema>;
export type MarksEntryFormData = z.infer<typeof marksEntrySchema>;
