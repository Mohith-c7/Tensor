import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import apiClient from '../../services/apiClient';
import { ApiError } from '../../types/api';
import { storeToken, clearSession, getToken } from '../../services/authService';

const BASE = 'http://localhost:3000/api/v1';

describe('apiClient', () => {
  beforeEach(() => clearSession());
  afterEach(() => clearSession());

  describe('Bearer token injection', () => {
    it('injects Authorization header when token is stored', async () => {
      storeToken('my-test-token');
      let capturedAuth: string | null = null;

      server.use(
        http.get(`${BASE}/test`, ({ request }) => {
          capturedAuth = request.headers.get('Authorization');
          return HttpResponse.json({ data: 'ok' });
        })
      );

      await apiClient.get('/test');
      expect(capturedAuth).toBe('Bearer my-test-token');
    });

    it('does not inject Authorization header when no token', async () => {
      let capturedAuth: string | null = 'present';

      server.use(
        http.get(`${BASE}/test`, ({ request }) => {
          capturedAuth = request.headers.get('Authorization');
          return HttpResponse.json({ data: 'ok' });
        })
      );

      await apiClient.get('/test');
      expect(capturedAuth).toBeNull();
    });
  });

  describe('401 handling', () => {
    it('clears session on 401 response', async () => {
      storeToken('my-token');
      server.use(
        http.get(`${BASE}/protected`, () =>
          HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        )
      );

      try {
        await apiClient.get('/protected');
      } catch {
        // expected
      }

      expect(getToken()).toBeNull();
    });

    it('dispatches auth:session-expired event on 401', async () => {
      storeToken('my-token');
      let fired = false;
      window.addEventListener('auth:session-expired', () => { fired = true; }, { once: true });

      server.use(
        http.get(`${BASE}/protected`, () =>
          HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        )
      );

      try { await apiClient.get('/protected'); } catch { /* expected */ }
      expect(fired).toBe(true);
    });
  });

  describe('403 handling', () => {
    it('throws ApiError with status 403', async () => {
      server.use(
        http.get(`${BASE}/admin`, () =>
          HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
        )
      );

      await expect(apiClient.get('/admin')).rejects.toMatchObject({
        status: 403,
        message: 'Forbidden',
      });
    });
  });

  describe('error message extraction', () => {
    it('extracts message from response body', async () => {
      server.use(
        http.get(`${BASE}/error`, () =>
          HttpResponse.json({ message: 'Custom error message' }, { status: 422 })
        )
      );

      let caught: ApiError | null = null;
      try {
        await apiClient.get('/error');
      } catch (e) {
        caught = e as ApiError;
      }

      expect(caught).toBeInstanceOf(ApiError);
      expect(caught?.message).toBe('Custom error message');
      expect(caught?.status).toBe(422);
    });
  });

  describe('AbortController cancellation', () => {
    it('throws when request is aborted', async () => {
      const controller = new AbortController();

      server.use(
        http.get(`${BASE}/slow`, async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ data: 'ok' });
        })
      );

      const promise = apiClient.get('/slow', { signal: controller.signal });
      controller.abort();

      await expect(promise).rejects.toBeDefined();
    });
  });
});
