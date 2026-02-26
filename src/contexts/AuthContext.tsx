"use client";

import { createContext, useContext, useState, useEffect } from 'react';import { jsx as _jsx } from "react/jsx-runtime";
const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('enlace-user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);


      if (parsed.image && !parsed.avatar) {
        parsed.avatar = parsed.image;
      }

      setUser(parsed);
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('enlace-user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('enlace-user');
  };

  return (
    _jsx(AuthContext.Provider, { value: { user, login, logout, isLoading }, children:
      children }
    ));

}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}