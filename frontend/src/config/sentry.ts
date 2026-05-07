import * as Sentry from '@sentry/react';
import { APP_ENV, SENTRY_DSN } from './env';

/**
 * Initialise Sentry with PII-safe beforeSend filter.
 * Requirements: 17.6, 17.7
 */
export function initSentry(): void {
  if (!SENTRY_DSN || APP_ENV === 'development') return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,
    tracesSampleRate: APP_ENV === 'production' ? 0.2 : 1.0,
    beforeSend(event, _hint) {
      // Include role context but strip userId / PII
      if (event.user) {
        const { role } = event.user as { role?: string };
        event.user = role ? { role } : {};
      }
      // Strip Authorization headers from breadcrumbs (if present)
      // Note: Sentry breadcrumbs structure may vary, so we handle gracefully
      try {
        if (event.breadcrumbs && Array.isArray(event.breadcrumbs)) {
          event.breadcrumbs = event.breadcrumbs.map((b) => {
            if (b.data && typeof b.data === 'object' && 'Authorization' in b.data) {
              return { ...b, data: { ...b.data, Authorization: '[Filtered]' } };
            }
            return b;
          });
        }
      } catch {
        // Ignore breadcrumb filtering errors
      }
      return event;
    },
  });
}
