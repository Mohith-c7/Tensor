/**
 * Property 24: Toast Stack Limit
 * Validates: Requirements 12.3
 * For any sequence of show calls, at most 3 toasts visible simultaneously.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToastContext } from '../../contexts/ToastContext';
import type { ToastVariant } from '../../types/domain';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('Property 24: Toast Stack Limit', () => {
  it('at most 3 toasts visible after any number of show calls', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            variant: fc.constantFrom<ToastVariant>('success', 'error', 'warning', 'info'),
            message: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (toastCalls) => {
          const { result } = renderHook(() => useToastContext(), { wrapper });

          act(() => {
            for (const call of toastCalls) {
              result.current.showToast(call);
            }
          });

          expect(result.current.toasts.length).toBeLessThanOrEqual(3);
        }
      )
    );
  });

  it('dismissing a toast removes it from the queue', () => {
    const { result } = renderHook(() => useToastContext(), { wrapper });

    act(() => {
      result.current.showToast({ variant: 'error', message: 'Error 1' });
      result.current.showToast({ variant: 'error', message: 'Error 2' });
    });

    const firstId = result.current.toasts[0]?.id;
    expect(firstId).toBeDefined();

    act(() => {
      result.current.dismissToast(firstId!);
    });

    expect(result.current.toasts.find((t) => t.id === firstId)).toBeUndefined();
  });
});
