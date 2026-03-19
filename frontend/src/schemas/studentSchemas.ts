import { z } from 'zod';

const today = () => new Date();

export const studentPersonalSchema = z.object({
  admissionNo: z
    .string()
    .min(1, 'Admission number is required')
    .regex(/^[A-Z0-9-]+$/, 'Admission number must contain only uppercase letters, digits, and hyphens'),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(100, 'First name must be at most 100 characters')
    .transform((s) => s.trim()),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(100, 'Last name must be at most 100 characters')
    .transform((s) => s.trim()),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => {
      const dob = new Date(val);
      if (isNaN(dob.getTime())) return false;
      const now = today();
      const age = now.getFullYear() - dob.getFullYear();
      const monthDiff = now.getMonth() - dob.getMonth();
      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate()) ? age - 1 : age;
      return actualAge >= 3 && actualAge <= 25;
    }, 'Student age must be between 3 and 25 years'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
});

export const studentContactSchema = z.object({
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const studentAcademicSchema = z.object({
  classId: z.number({ required_error: 'Class is required' }).int().positive('Class is required'),
  sectionId: z.number({ required_error: 'Section is required' }).int().positive('Section is required'),
  admissionDate: z
    .string()
    .min(1, 'Admission date is required')
    .refine((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      return date <= today();
    }, 'Admission date cannot be in the future'),
});

export const studentParentSchema = z.object({
  parentName: z
    .string()
    .min(2, 'Parent name must be at least 2 characters')
    .transform((s) => s.trim()),
  parentPhone: z
    .string()
    .regex(/^\d{10,15}$/, 'Parent phone must be 10–15 digits'),
  parentEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
});

export const studentFullSchema = studentPersonalSchema
  .merge(studentContactSchema)
  .merge(studentAcademicSchema)
  .merge(studentParentSchema);

export type StudentPersonalFormData = z.infer<typeof studentPersonalSchema>;
export type StudentContactFormData = z.infer<typeof studentContactSchema>;
export type StudentAcademicFormData = z.infer<typeof studentAcademicSchema>;
export type StudentParentFormData = z.infer<typeof studentParentSchema>;
export type StudentFullFormData = z.infer<typeof studentFullSchema>;
