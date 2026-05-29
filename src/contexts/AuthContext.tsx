


'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, UserRole } from '@/types/auth';
import { STORAGE_KEYS } from '@/config/constants';
import { ApiClientError, apiGet, apiPost } from '@/lib/api/client';


const AuthContext = createContext<AuthState | undefined>(undefined);


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  const loadUserFromSession = useCallback(async () => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);


      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser) as User;


          if (parsed.image && !parsed.avatar) {
            parsed.avatar = parsed.image;
          }

          setUser(parsed);


          apiGet<{ authenticated: boolean }>('/api/auth/verify').then((session) => {
            if (!session.authenticated) {
              setUser(null);
              localStorage.removeItem(STORAGE_KEYS.USER);
            }
          }).catch((error) => {
            if (error instanceof ApiClientError && error.status === 401) {
              setUser(null);
              localStorage.removeItem(STORAGE_KEYS.USER);
            }

          });
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
      } else {

        const data = await apiGet<{ authenticated: boolean; user?: User }>('/api/auth/verify');
        if (data.authenticated && data.user) {
          const verifiedUser = data.user;
          if (verifiedUser.image && !verifiedUser.avatar) {
            verifiedUser.avatar = verifiedUser.image;
          }
          setUser(verifiedUser);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(verifiedUser));
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {

      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserFromSession();
  }, [loadUserFromSession]);


  const login = async (userData: User, _token?: string) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
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
