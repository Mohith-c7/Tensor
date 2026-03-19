import { z } from 'zod';

const timeRegex = /^\d{2}:\d{2}$/;

export const timetableEntrySchema = z
  .object({
    subject: z.string().min(1, 'Subject is required'),
    teacherId: z
      .number({ required_error: 'Teacher is required' })
      .int()
      .positive('Teacher is required'),
    roomNumber: z.string().optional(),
    startTime: z
      .string()
      .regex(timeRegex, 'Start time must be in HH:mm format'),
    endTime: z
      .string()
      .regex(timeRegex, 'End time must be in HH:mm format'),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export type TimetableEntryFormData = z.infer<typeof timetableEntrySchema>;
