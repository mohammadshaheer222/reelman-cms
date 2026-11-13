'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User } from '@/types';

const CACHE_KEY = 'reelman_user_session';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      // If we already have a cached user, we don't need to block UI with a full-screen loader
      return !localStorage.getItem(CACHE_KEY);
    }
    return true;
  });

  const isRedirectingRef = useRef(false);

  const redirectToLogin = useCallback((expired = true) => {
    if (isRedirectingRef.current) return;
    if (typeof window === 'undefined') return;

    const currentPath = window.location.pathname;
    if (currentPath === '/login' || currentPath === '/register') return;

    isRedirectingRef.current = true;
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      // ignore
    }
    setUser(null);

    const params = new URLSearchParams();
    if (expired) {
      params.set('expired', 'true');
    }
    if (currentPath && currentPath !== '/') {
      params.set('redirect', `${currentPath}${window.location.search || ''}`);
    }

    const query = params.toString();
    window.location.href = query ? `/login?${query}` : '/login';
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.status === 401) {
        redirectToLogin(true);
        return;
      }
      if (!res.ok) {
        // Do NOT redirect to login on 500 server error — prevents infinite redirect loops
        console.error('Session check returned status:', res.status);
        return;
      }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data.user));
        } catch {
          // ignore
        }
      } else {
        redirectToLogin(true);
      }
    } catch (err) {
      console.error('Network error checking session:', err);
    } finally {
      setLoading(false);
    }
  }, [redirectToLogin]);

  // Global fetch interceptor: redirect to login if any authenticated API returns 401 Unauthorized
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      let url = '';
      if (typeof args[0] === 'string') {
        url = args[0];
      } else if (args[0] && typeof (args[0] as Request).url === 'string') {
        url = (args[0] as Request).url;
      }

      // If an authenticated API route returns 401 (excluding credentials failure on login endpoint)
      if (response.status === 401 && !url.includes('/api/auth/login')) {
        redirectToLogin(true);
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [redirectToLogin]);

  // Check auth on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      // ignore
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login?logout=true';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      loading: false,
      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } finally {
          if (typeof window !== 'undefined') {
            window.location.href = '/login?logout=true';
          }
        }
      },
      refetchUser: async () => {},
    };
  }
  return context;
}
