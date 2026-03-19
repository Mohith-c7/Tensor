const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is required but not defined');
}

export const API_BASE_URL: string = apiBaseUrl;
export const APP_ENV: string = import.meta.env.VITE_ENV ?? 'development';
export const SENTRY_DSN: string | undefined = import.meta.env.VITE_SENTRY_DSN;
