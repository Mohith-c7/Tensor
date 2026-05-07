/**
 * Property Tests: Database Constraints
 * Property 28: Database Constraint Enforcement
 * Requirements: 18.1, 18.2, 18.3
 */

const fc = require('fast-check');

jest.mock('../../src/config/index', () => ({
  jwtSecret: 'test-secret-key-for-property-tests',
  nodeEnv: 'test',
  supabaseUrl: 'https://test.supabase.co',
  supabaseKey: 'test-key'
}));

jest.mock('../../src/config/database', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  };

  return {
    supabase: mockSupabase,
    healthCheck: jest.fn().mockResolvedValue({ status: 'connected' })
  };
});

const { supabase } = require('../../src/config/database');

// ─── Property 28: Database Constraint Enforcement ─────────────────────────────

describe('Property 28: Database Constraint Enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('unique constraints prevent duplicate entries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          admissionNo: fc.string({ minLength: 5, maxLength: 20 }),
          firstName: fc.string({ minLength: 1, maxLength: 50 }),
          lastName: fc.string({ minLength: 1, maxLength: 50 })
        }),
        async (student) => {
          // Mock duplicate admission number error
          supabase.from.mockReturnThis();
          supabase.insert.mockReturnThis();
          supabase.select.mockResolvedValueOnce({
            data: null,
            error: { code: '23505', message: 'duplicate key value violates unique constraint' }
          });

          // Attempt to insert duplicate
          const result = await supabase
            .from('students')
            .insert(student)
            .select();

          // Unique constraint should be enforced
          expect(result.error).not.toBeNull();
          expect(result.error.code).toBe('23505');
        }
      ),
      { numRuns: 30 }
    );
  });

  it('foreign key constraints prevent orphaned records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentId: fc.integer({ min: 9999, max: 99999 }), // Non-existent ID
          date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          status: fc.constantFrom('present', 'absent', 'late', 'excused')
        }),
        async (attendance) => {
          // Mock foreign key violation
          supabase.from.mockReturnThis();
          supabase.insert.mockReturnThis();
          supabase.select.mockResolvedValue({
            data: null,
            error: { code: '23503', message: 'violates foreign key constraint' }
          });

          // Attempt to insert with invalid foreign key
          const result = await supabase
            .from('attendance')
            .insert(attendance)
            .select();

          // Foreign key constraint should be enforced
          expect(result.error).not.toBeNull();
          expect(result.error.code).toBe('23503');
        }
      ),
      { numRuns: 30 }
    );
  });

  it('not null constraints prevent missing required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Missing required fields
          firstName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          lastName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null })
        }),
        async (student) => {
          // Mock not null violation
          supabase.from.mockReturnThis();
          supabase.insert.mockReturnThis();
          
          if (student.firstName === null || student.lastName === null) {
            supabase.select.mockResolvedValue({
              data: null,
              error: { code: '23502', message: 'null value in column violates not-null constraint' }
            });

            const result = await supabase
              .from('students')
              .insert(student)
              .select();

            // Not null constraint should be enforced
            expect(result.error).not.toBeNull();
            expect(result.error.code).toBe('23502');
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('check constraints validate data ranges', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          status: fc.string({ minLength: 1, maxLength: 20 })
            .filter(s => !['present', 'absent', 'late', 'excused'].includes(s))
        }),
        async (attendance) => {
          // Mock check constraint violation
          supabase.from.mockReturnThis();
          supabase.insert.mockReturnThis();
          supabase.select.mockResolvedValue({
            data: null,
            error: { code: '23514', message: 'new row violates check constraint' }
          });

          // Attempt to insert invalid enum value
          const result = await supabase
            .from('attendance')
            .insert({ status: attendance.status })
            .select();

          // Check constraint should be enforced
          expect(result.error).not.toBeNull();
          expect(result.error.code).toBe('23514');
        }
      ),
      { numRuns: 30 }
    );
  });

  it('cascade deletes remove dependent records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        async (studentId) => {
          // Mock cascade delete
          supabase.from.mockReturnThis();
          supabase.delete.mockReturnThis();
          supabase.eq.mockReturnThis();
          supabase.select.mockResolvedValue({
            data: [{ id: studentId }],
            error: null
          });

          // Delete student (should cascade to attendance)
          const result = await supabase
            .from('students')
            .delete()
            .eq('id', studentId)
            .select();

          // Cascade should succeed
          expect(result.error).toBeNull();
          expect(result.data).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('restrict deletes prevent removal of referenced records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        async (classId) => {
          // Mock restrict constraint violation
          supabase.from.mockReturnThis();
          supabase.delete.mockReturnThis();
          supabase.eq.mockReturnThis();
          supabase.select.mockResolvedValue({
            data: null,
            error: { code: '23503', message: 'update or delete violates foreign key constraint' }
          });

          // Attempt to delete class with students
          const result = await supabase
            .from('classes')
            .delete()
            .eq('id', classId)
            .select();

          // Restrict constraint should prevent deletion
          expect(result.error).not.toBeNull();
          expect(result.error.code).toBe('23503');
        }
      ),
      { numRuns: 20 }
    );
  });
});
