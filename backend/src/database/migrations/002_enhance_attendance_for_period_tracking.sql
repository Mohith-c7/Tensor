-- Migration: 002_enhance_attendance_for_period_tracking
-- Add period_number to attendance table for per-period attendance tracking
-- This enables accurate attendance percentage calculation based on classes attended

ALTER TABLE attendance ADD COLUMN period_number INTEGER;
ALTER TABLE attendance ADD COLUMN subject VARCHAR(100);

-- Update existing records to have period_number = 1 (assuming single period per day previously)
UPDATE attendance SET period_number = 1 WHERE period_number IS NULL;

-- Make period_number NOT NULL after updating
ALTER TABLE attendance ALTER COLUMN period_number SET NOT NULL;

-- Add foreign key to timetable for validation (optional, but good practice)
-- Note: This assumes timetable has unique constraints on class/section/day/period

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_date_period ON attendance(student_id, date, period_number);

-- Update the unique constraint to include period_number
DROP INDEX IF EXISTS idx_attendance_student_date;
CREATE UNIQUE INDEX idx_attendance_student_date_period_unique ON attendance(student_id, date, period_number);