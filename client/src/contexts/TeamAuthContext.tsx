import React, { createContext, useContext, useState, useCallback } from 'react';

interface TeamAuthState {
  isAuthenticated: boolean;
  token: string;
  login: (token: string) => void;
  logout: () => void;
}

const TeamAuthContext = createContext<TeamAuthState | null>(null);

export function TeamAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!sessionStorage.getItem('shatranj_team_token'));
  const [token, setToken] = useState(() => sessionStorage.getItem('shatranj_team_token') || '');

  const login = useCallback((t: string) => {
    sessionStorage.setItem('shatranj_team_token', t);
    setToken(t);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('shatranj_team_token');
    setToken('');
    setIsAuthenticated(false);
  }, []);

  return (
    <TeamAuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </TeamAuthContext.Provider>
  );
}

export function useTeamAuth(): TeamAuthState {
  const ctx = useContext(TeamAuthContext);
  if (!ctx) throw new Error('useTeamAuth must be used inside TeamAuthProvider');
  return ctx;
}
