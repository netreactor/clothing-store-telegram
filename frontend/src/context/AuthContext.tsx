import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTelegram } from './TelegramContext';

interface AuthUser {
  id: number;
  telegramId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'admin' | 'master_admin';
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isMasterAdmin: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  authenticateWithTelegram: () => Promise<void>;
  authenticateWithPassword: (username: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'telegram_auth_token';
const USER_KEY = 'telegram_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { initData, isTelegramEnvironment, isReady } = useTelegram();

  // Check for existing authentication on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  // Auto-authenticate with Telegram if in Telegram environment
  useEffect(() => {
    if (isReady && isTelegramEnvironment && initData && !token) {
      authenticateWithTelegram();
    }
  }, [isReady, isTelegramEnvironment, initData, token]);

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const authenticateWithTelegram = async () => {
    if (!initData) {
      console.error('No Telegram initData available');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Authentication failed');
      }

      const data = await response.json();

      login(data.token, data.user);

      console.log('✅ Telegram authentication successful:', data.user);
    } catch (error) {
      console.error('Telegram authentication error:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithPassword = async (username: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Authentication failed');
      }

      const data = await response.json();

      login(data.token, data.user);

      console.log('✅ Password authentication successful:', data.user);
    } catch (error) {
      console.error('Password authentication error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    isAdmin: user?.role === 'admin' || user?.role === 'master_admin',
    isMasterAdmin: user?.role === 'master_admin',
    login,
    logout,
    authenticateWithTelegram,
    authenticateWithPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
