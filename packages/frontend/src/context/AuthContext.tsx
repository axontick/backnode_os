import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginDto, SignupDto } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (dto: LoginDto) => Promise<void>;
  signup: (dto: SignupDto) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('backnode_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Restore session if token exists
  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem('backnode_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authApi.getMe();
        setUser(currentUser);
        setToken(storedToken);
      } catch (err) {
        console.warn('Session restoration failed or token expired:', err);
        localStorage.removeItem('backnode_token');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (dto: LoginDto) => {
    const res = await authApi.login(dto);
    localStorage.setItem('backnode_token', res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  const signup = async (dto: SignupDto) => {
    const res = await authApi.signup(dto);
    localStorage.setItem('backnode_token', res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout notification failed:', err);
    } finally {
      localStorage.removeItem('backnode_token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
