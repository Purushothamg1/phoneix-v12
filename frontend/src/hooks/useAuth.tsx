'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface User { id: string; email: string; name: string; role: 'ADMIN' | 'MANAGER' | 'STAFF'; }
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('phoneix_token');
    if (!storedToken) { setIsLoading(false); return; }

    // Re-fetch user from API to get the latest role (avoids stale cached role)
    api.get('/auth/me')
      .then(({ data }) => {
        localStorage.setItem('phoneix_user', JSON.stringify(data));
        setToken(storedToken);
        setUser(data);
      })
      .catch(() => {
        // Token invalid or expired — clean up
        localStorage.removeItem('phoneix_token');
        localStorage.removeItem('phoneix_user');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('phoneix_token', data.token);
    localStorage.setItem('phoneix_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('phoneix_token');
    localStorage.removeItem('phoneix_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
