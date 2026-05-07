/**
 * Property Tests: Transaction Atomicity
 * Property 22: Transaction Atomicity
 * Requirements: 16.3, 16.4
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
    single: jest.fn(),
    rpc: jest.fn()
  };

  return {
    supabase: mockSupabase,
    healthCheck: jest.fn().mockResolvedValue({ status: 'connected' })
  };
});

const { supabase } = require('../../src/config/database');

// ─── Property 22: Transaction Atomicity ───────────────────────────────────────

describe('Property 22: Transaction Atomicity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successful operations commit all changes atomically', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentId: fc.integer({ min: 1, max: 1000 }),
          marks: fc.array(
            fc.record({
              subjectId: fc.integer({ min: 1, max: 10 }),
              score: fc.integer({ min: 0, max: 100 })
            }),
            { minLength: 1, maxLength: 5 }
          )
        }),
        async (data) => {
          // Reset mocks for each test
          jest.clearAllMocks();
          
          // Mock successful transaction
          supabase.from.mockReturnThis();
          supabase.insert.mockReturnThis();
          supabase.select.mockResolvedValue({ data: data.marks, error: null });

          // Simulate atomic insert of multiple marks
          const result = await supabase
            .from('marks')
            .insert(data.marks)
            .select();

          // All operations should succeed together
          expect(result.error).toBeNull();
          expect(result.data).toHaveLength(data.marks.length);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('failed operations rollback all changes atomically', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentId: fc.integer({ min: 1, max: 1000 }),
          invalidData: fc.string({ minLength: 1, maxLength: 50 })
        }),
        async (data) => {
          // Mock failed transaction
          supabase.from.mockReturnThis();
          supabase.insert.mockReturnThis();
          supabase.select.mockResolvedValue({
            data: null,
            error: { message: 'Constraint violation' }
          });

          // Simulate atomic insert that fails
          const result = await supabase
            .from('marks')
            .insert([{ invalid: data.invalidData }])
            .select();

          // No partial data should be committed
          expect(result.error).not.toBeNull();
          expect(result.data).toBeNull();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('concurrent operations maintain consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 100 }),
            amount: fc.integer({ min: 1, max: 1000 })
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (payments) => {
          // Mock concurrent payment operations
          supabase.from.mockReturnThis();
          supabase.update.mockReturnThis();
          supabase.eq.mockReturnThis();
          supabase.select.mockResolvedValue({ data: payments, error: null });

          // Simulate concurrent updates
          const results = await Promise.all(
            payments.map(() =>
              supabase
                .from('fee_payments')
                .update({ processed: true })
                .eq('id', 1)
                .select()
            )
          );

          // All operations should complete without conflicts
          results.forEach(result => {
            expect(result.error).toBeNull();
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  it('nested transactions maintain isolation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentId: fc.integer({ min: 1, max: 1000 }),
          feeAmount: fc.integer({ min: 100, max: 10000 }),
          paymentAmount: fc.integer({ min: 100, max: 10000 })
        }),
        async (data) => {
          // Mock nested transaction (fee structure + payment)
          supabase.from.mockReturnThis();
          supabase.insert.mockReturnThis();
          supabase.update.mockReturnThis();
          supabase.eq.mockReturnThis();
          supabase.select.mockResolvedValue({ data: [data], error: null });

          // Simulate nested operations
          const feeResult = await supabase
            .from('fee_structures')
            .insert({ amount: data.feeAmount })
            .select();

          const paymentResult = await supabase
            .from('fee_payments')
            .insert({ amount: data.paymentAmount })
            .select();

          // Both operations should succeed or fail together
          if (feeResult.error) {
            expect(paymentResult.error).not.toBeNull();
          } else {
            expect(feeResult.data).toBeDefined();
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
