/**
 * Authentication context provider
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, UserRole } from '@/types/auth';
import { STORAGE_KEYS } from '@/config/constants';

// Create context with proper typing
const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Authentication provider component
 * Manages user authentication state across the app
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load user from session
   */
  const loadUserFromSession = useCallback(async () => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);

      // First check localStorage for quick load
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser) as User;

          // Handle legacy avatar field
          if (parsed.image && !parsed.avatar) {
            parsed.avatar = parsed.image;
          }

          setUser(parsed);

          // Verify session is still valid in background
          fetch('/api/auth/verify', {
            credentials: 'include',
          }).then(res => {
            if (!res.ok) {
              // Session expired
              setUser(null);
              localStorage.removeItem(STORAGE_KEYS.USER);
            }
          }).catch(() => {
            // Network error, keep user logged in
          });
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
      } else {
        // No saved user, check if session exists server-side
        const response = await fetch('/api/auth/verify', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && savedUser) {
            const parsed = JSON.parse(savedUser) as User;
            if (parsed.image && !parsed.avatar) {
              parsed.avatar = parsed.image;
            }
            setUser(parsed);
          }
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      // Always stop loading, even if something fails
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserFromSession();
  }, [loadUserFromSession]);

  /**
   * Login function - saves user to state and localStorage
   */
  const login = async (userData: User, _token?: string) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  };

  /**
   * Logout function - clears user from state, localStorage, and server
   */
  const logout = async () => {
    try {
      // Revoke server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
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

/**
 * Hook to access authentication context
 *
 * @returns Auth state and methods
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to access authentication context with derived values
 * Provides convenient computed values for role-based access control
 *
 * @returns Auth state with derived role checks
 * @throws Error if used outside AuthProvider
 */
export function useAuthWithRoles() {
  const context = useAuth();
  const { user } = context;

  // Derived state for convenience
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
    // Derived values
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
