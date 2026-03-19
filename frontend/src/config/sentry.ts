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
    beforeSend(event, hint) {
      // Include role context but strip userId / PII
      if (event.user) {
        const { role } = event.user as { role?: string };
        event.user = role ? { role } : {};
      }
      // Strip Authorization headers from breadcrumbs
      if (event.breadcrumbs?.values) {
        event.breadcrumbs.values = event.breadcrumbs.values.map((b) => {
          if (b.data?.['Authorization']) {
            b.data = { ...b.data, Authorization: '[Filtered]' };
          }
          return b;
        });
      }
      return event;
    },
  });
}
