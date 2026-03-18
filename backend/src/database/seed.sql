-- ============================================================
-- Seed Data - Default admin user and sample classes
-- Run AFTER schema.sql
-- Password: Admin@123 (bcrypt hash)
-- ============================================================

-- Default admin user
INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
VALUES (
  'admin@tensorschool.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: Admin@123
  'admin',
  'System',
  'Admin',
  '+1234567890'
) ON CONFLICT (email) DO NOTHING;

-- Sample classes
INSERT INTO classes (name, description) VALUES
  ('Class 1', 'First Grade'),
  ('Class 2', 'Second Grade'),
  ('Class 3', 'Third Grade'),
  ('Class 4', 'Fourth Grade'),
  ('Class 5', 'Fifth Grade'),
  ('Class 6', 'Sixth Grade'),
  ('Class 7', 'Seventh Grade'),
  ('Class 8', 'Eighth Grade'),
  ('Class 9', 'Ninth Grade'),
  ('Class 10', 'Tenth Grade')
ON CONFLICT DO NOTHING;

-- Sample sections for each class
INSERT INTO sections (name, class_id)
SELECT s.name, c.id
FROM classes c
CROSS JOIN (VALUES ('A'), ('B'), ('C')) AS s(name)
ON CONFLICT DO NOTHING;
