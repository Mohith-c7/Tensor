-- ============================================================
-- Seed Data - Default admin user and sample classes
-- Run AFTER schema.sql
-- Password: Admin@123 (bcrypt hash)
-- ============================================================

-- Default admin user
INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
VALUES (
  'admin@tensorschool.com',
  '$2a$10$F82DF73ufuFabRDF6F0HX.8J8dZCerVggtj4NVXxjJXlhQJS.xAo2', -- password: Admin@123
  'admin',
  'System',
  'Admin',
  '+1234567890'
) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Sample classes
INSERT INTO classes (name, description) VALUES
  ('Nursery',  'Nursery'),
  ('LKG',      'Lower Kindergarten'),
  ('UKG',      'Upper Kindergarten'),
  ('Class 1',  'First Grade'),
  ('Class 2',  'Second Grade'),
  ('Class 3',  'Third Grade'),
  ('Class 4',  'Fourth Grade'),
  ('Class 5',  'Fifth Grade'),
  ('Class 6',  'Sixth Grade'),
  ('Class 7',  'Seventh Grade'),
  ('Class 8',  'Eighth Grade'),
  ('Class 9',  'Ninth Grade'),
  ('Class 10', 'Tenth Grade')
ON CONFLICT DO NOTHING;

-- Sections A–D for each class
INSERT INTO sections (name, class_id)
SELECT s.name, c.id
FROM classes c
CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D')) AS s(name)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SAMPLE TIMETABLE - Required for attendance percentage calculation
-- ============================================================

-- Sample timetable for Class 1, Section A (assuming class_id=4, section_id based on seed)
-- Monday to Friday, 8 periods per day
INSERT INTO timetable (class_id, section_id, day_of_week, period_number, start_time, end_time, subject, teacher_id, room_number)
SELECT
  c.id as class_id,
  s.id as section_id,
  d.day_of_week,
  d.period_number,
  d.start_time,
  d.end_time,
  d.subject,
  u.id as teacher_id,
  d.room_number
FROM classes c
CROSS JOIN sections s
CROSS JOIN (
  VALUES
    ('monday', 1, '08:00:00', '08:45:00', 'Mathematics', '101'),
    ('monday', 2, '08:45:00', '09:30:00', 'English', '102'),
    ('monday', 3, '09:45:00', '10:30:00', 'Science', '103'),
    ('monday', 4, '10:30:00', '11:15:00', 'Social Studies', '104'),
    ('monday', 5, '11:30:00', '12:15:00', 'Hindi', '105'),
    ('monday', 6, '12:15:00', '13:00:00', 'Computer Science', '106'),
    ('monday', 7, '14:00:00', '14:45:00', 'Art', '107'),
    ('monday', 8, '14:45:00', '15:30:00', 'Physical Education', '108'),

    ('tuesday', 1, '08:00:00', '08:45:00', 'Science', '103'),
    ('tuesday', 2, '08:45:00', '09:30:00', 'Mathematics', '101'),
    ('tuesday', 3, '09:45:00', '10:30:00', 'English', '102'),
    ('tuesday', 4, '10:30:00', '11:15:00', 'Hindi', '105'),
    ('tuesday', 5, '11:30:00', '12:15:00', 'Social Studies', '104'),
    ('tuesday', 6, '12:15:00', '13:00:00', 'Computer Science', '106'),
    ('tuesday', 7, '14:00:00', '14:45:00', 'Physical Education', '108'),
    ('tuesday', 8, '14:45:00', '15:30:00', 'Art', '107'),

    ('wednesday', 1, '08:00:00', '08:45:00', 'English', '102'),
    ('wednesday', 2, '08:45:00', '09:30:00', 'Science', '103'),
    ('wednesday', 3, '09:45:00', '10:30:00', 'Mathematics', '101'),
    ('wednesday', 4, '10:30:00', '11:15:00', 'Computer Science', '106'),
    ('wednesday', 5, '11:30:00', '12:15:00', 'Hindi', '105'),
    ('wednesday', 6, '12:15:00', '13:00:00', 'Social Studies', '104'),
    ('wednesday', 7, '14:00:00', '14:45:00', 'Art', '107'),
    ('wednesday', 8, '14:45:00', '15:30:00', 'Physical Education', '108'),

    ('thursday', 1, '08:00:00', '08:45:00', 'Mathematics', '101'),
    ('thursday', 2, '08:45:00', '09:30:00', 'Hindi', '105'),
    ('thursday', 3, '09:45:00', '10:30:00', 'Science', '103'),
    ('thursday', 4, '10:30:00', '11:15:00', 'English', '102'),
    ('thursday', 5, '11:30:00', '12:15:00', 'Computer Science', '106'),
    ('thursday', 6, '12:15:00', '13:00:00', 'Social Studies', '104'),
    ('thursday', 7, '14:00:00', '14:45:00', 'Physical Education', '108'),
    ('thursday', 8, '14:45:00', '15:30:00', 'Art', '107'),

    ('friday', 1, '08:00:00', '08:45:00', 'Science', '103'),
    ('friday', 2, '08:45:00', '09:30:00', 'English', '102'),
    ('friday', 3, '09:45:00', '10:30:00', 'Mathematics', '101'),
    ('friday', 4, '10:30:00', '11:15:00', 'Social Studies', '104'),
    ('friday', 5, '11:30:00', '12:15:00', 'Hindi', '105'),
    ('friday', 6, '12:15:00', '13:00:00', 'Computer Science', '106'),
    ('friday', 7, '14:00:00', '14:45:00', 'Art', '107'),
    ('friday', 8, '14:45:00', '15:30:00', 'Physical Education', '108')
) AS d(day_of_week, period_number, start_time, end_time, subject, room_number)
CROSS JOIN users u
WHERE c.name = 'Class 1'
  AND s.name = 'A'
  AND u.email = 'admin@tensorschool.com'
ON CONFLICT DO NOTHING;
