import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type AuthUser } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  hasRole: (role: string) => boolean;
  isAdminOrManager: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const result = await api.login(email, password);
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      setUser(result.user);
      return { error: null };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  function signOut() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }

  function hasRole(role: string) {
    return user?.roles?.includes(role) ?? false;
  }

  const isAdminOrManager = user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER') || false;

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, hasRole, isAdminOrManager }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
