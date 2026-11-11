'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isRedirectingRef = useRef(false);

  const redirectToLogin = useCallback((expired = true) => {
    if (isRedirectingRef.current) return;
    if (typeof window === 'undefined') return;

    const currentPath = window.location.pathname;
    // Don't redirect if already on login or register page
    if (currentPath === '/login' || currentPath === '/register') return;

    isRedirectingRef.current = true;
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
        redirectToLogin(false);
        return;
      }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        redirectToLogin(true);
      }
    } catch {
      redirectToLogin(false);
    } finally {
      setLoading(false);
    }
  }, [redirectToLogin]);

  // Global fetch interceptor: redirect to login if any API returns 401 Unauthorized
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

  useEffect(() => {
    let ignore = false;
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (ignore) return;
        if (res.status === 401) {
          redirectToLogin(true);
          return;
        }
        if (!res.ok) {
          redirectToLogin(false);
          return;
        }
        const data = await res.json();
        if (ignore) return;
        if (data.user) {
          setUser(data.user);
        } else {
          redirectToLogin(true);
        }
      } catch {
        if (!ignore) {
          redirectToLogin(false);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    checkAuth();
    return () => {
      ignore = true;
    };
  }, [redirectToLogin]);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
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
    // Fallback if useAuth is invoked outside AuthProvider
    return {
      user: null,
      loading: false,
      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } finally {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      },
      refetchUser: async () => {},
    };
  }
  return context;
}
