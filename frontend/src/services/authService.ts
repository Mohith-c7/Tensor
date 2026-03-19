import type { DecodedToken } from '../types/api';

const TOKEN_KEY = 'auth_token';
const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export function storeToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearSession(): void {
  sessionStorage.clear();
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
