import React, { createContext, useContext, useState, useCallback } from 'react';

interface AdminAuthState {
  isAuthenticated: boolean;
  token: string;
  login: (token: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!sessionStorage.getItem('shatranj_admin_token'));
  const [token, setToken] = useState(() => sessionStorage.getItem('shatranj_admin_token') || '');

  const login = useCallback((t: string) => {
    sessionStorage.setItem('shatranj_admin_token', t);
    setToken(t);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('shatranj_admin_token');
    setToken('');
    setIsAuthenticated(false);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthState {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
