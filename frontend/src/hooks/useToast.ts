import { useToastContext } from '../contexts/ToastContext';

/**
 * Expose showToast and dismissToast from ToastContext.
 * Requirements: 12.1
 */
export function useToast() {
  const { showToast, dismissToast } = useToastContext();
  return { showToast, dismissToast };
}
