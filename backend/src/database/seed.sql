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
