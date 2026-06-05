


'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, UserRole } from '@/types/auth';
import { STORAGE_KEYS } from '@/config/constants';
import { ApiClientError, apiGet, apiPost } from '@/lib/api/client';

function normalizeUser(user: User): User {
  if (user.image && !user.avatar) {
    return { ...user, avatar: user.image };
  }
  return user;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserFromSession = useCallback(async () => {
    try {
      const data = await apiGet<{ authenticated: boolean; user?: User }>('/api/auth/verify');
      if (data.authenticated && data.user) {
        setUser(normalizeUser(data.user));
      } else {
        setUser(null);
      }
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        setUser(null);
      } else {
        console.error('Error loading session:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    loadUserFromSession();
  }, [loadUserFromSession]);

  useEffect(() => {
    if (!user) return;

    const refreshSession = () => {
      apiGet<{ authenticated: boolean; user?: User }>('/api/auth/verify')
        .then((session) => {
          if (!session.authenticated || !session.user) {
            setUser(null);
            return;
          }
          setUser(normalizeUser(session.user));
        })
        .catch((error) => {
          if (error instanceof ApiClientError && error.status === 401) {
            setUser(null);
          }
        });
    };

    const interval = window.setInterval(refreshSession, 15 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [user]);

  const login = async (userData: User) => {
    setUser(normalizeUser(userData));
  };

  const logout = async () => {
    try {
      await apiPost('/api/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  };

  const contextValue: AuthState = {
    user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthWithRoles() {
  const context = useAuth();
  const { user } = context;

  const isAuthenticated = !!user;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isEngineer = user?.role === UserRole.ENGINEER;
  const isOperator = user?.role === UserRole.OPERATOR;
  const canManageUsers = isAdmin || isEngineer;
  const canCreateReports = isAuthenticated;
  const canViewAllReports = isAdmin || isEngineer;
  const canEditSettings = isAdmin || isEngineer;

  return {
    ...context,
    isAuthenticated,
    isAdmin,
    isEngineer,
    isOperator,
    canManageUsers,
    canCreateReports,
    canViewAllReports,
    canEditSettings,
  };
}
