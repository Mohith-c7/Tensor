import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DecodedToken, LoginRequest } from '../types/api';
import type { AuthStatus } from '../types/domain';
import {
  clearSession,
  decodeToken,
  getToken,
  getUserMeta,
  isNearExpiry,
  storeToken,
  storeUserMeta,
} from '../services/authService';
import { API_BASE_URL } from '../config/env';

interface AuthUser {
  userId: number;
  role: 'admin' | 'teacher';
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isTeacher: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  const setAuthenticated = useCallback((jwt: string) => {
    const decoded = decodeToken(jwt) as DecodedToken | null;
    if (!decoded) {
      clearSession();
      setStatus('unauthenticated');
      return;
    }
    const meta = getUserMeta();
    const firstName = meta?.firstName ?? '';
    const lastName = meta?.lastName ?? '';
    setToken(jwt);
    setUser({
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim() || decoded.email,
    });
    setStatus('authenticated');
  }, []);

  // On mount: verify existing token
  useEffect(() => {
    const existingToken = getToken();
    if (!existingToken) {
      setStatus('unauthenticated');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${existingToken}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (res.status === 401) {
          clearSession();
          setStatus('unauthenticated');
        } else if (res.ok) {
          setAuthenticated(existingToken);
        } else {
          setStatus('unauthenticated');
        }
      })
      .catch(() => {
        setStatus('unauthenticated');
      });

    return () => controller.abort();
  }, [setAuthenticated]);

  // Session expiry check every 60s
  useEffect(() => {
    if (status !== 'authenticated') return;
    const interval = setInterval(() => {
      const currentToken = getToken();
      if (currentToken && isNearExpiry(currentToken)) {
        window.dispatchEvent(new CustomEvent('auth:session-warning'));
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [status]);

  const login = useCallback(async (email: string, password: string) => {
    const body: LoginRequest = { email, password };
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error('Invalid email or password');
    }
    const data = await res.json() as { data: { accessToken: string; user: { firstName: string; lastName: string } } };
    storeToken(data.data.accessToken);
    storeUserMeta(data.data.user.firstName, data.data.user.lastName);
    setAuthenticated(data.data.accessToken);
  }, [setAuthenticated]);

  const logout = useCallback(() => {
    abortControllerRef.current?.abort();
    clearSession();
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        token,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isTeacher: user?.role === 'teacher',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
