import type { DecodedToken } from '../types/api';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';
const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export function storeTokens(accessToken: string, refreshToken: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken); // Refresh token in localStorage (more persistent)
}

export function storeToken(token: string): void {
  // Legacy support - store as access token
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function storeUserMeta(firstName: string, lastName: string): void {
  sessionStorage.setItem(USER_KEY, JSON.stringify({ firstName, lastName }));
}

export function getUserMeta(): { firstName: string; lastName: string } | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getToken(): string | null {
  // Legacy support - return access token
  return getAccessToken();
}

export function clearSession(): void {
  sessionStorage.clear();
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // base64url decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const decoded = JSON.parse(atob(padded)) as unknown;
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      !('userId' in decoded) ||
      !('role' in decoded) ||
      !('exp' in decoded) ||
      !('iat' in decoded)
    ) {
      return null;
    }
    return decoded as DecodedToken;
  } catch {
    return null;
  }
}

export function isExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  return Date.now() >= decoded.exp * 1000;
}

export function isNearExpiry(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  return Date.now() >= decoded.exp * 1000 - EXPIRY_BUFFER_MS;
}
