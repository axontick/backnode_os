import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginDto, SignupDto, ForgotPasswordDto, ResetPasswordDto, UserRole, AuthResponse } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (dto: LoginDto) => Promise<AuthResponse>;
  signup: (dto: SignupDto) => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<{ message: string; devToken?: string }>;
  resetPassword: (dto: ResetPasswordDto) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  effectiveRole: UserRole;
  setEffectiveRole: (role: UserRole) => void;
  effectiveDepartment: string;
  setEffectiveDepartment: (dept: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('backnode_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [effectiveRole, setEffectiveRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('backnode_effective_role') as UserRole) || 'OWNER';
  });

  const [effectiveDepartment, setEffectiveDepartmentState] = useState<string>(() => {
    return localStorage.getItem('backnode_effective_department') || 'Engineering';
  });

  const setEffectiveRole = (role: UserRole) => {
    setEffectiveRoleState(role);
    localStorage.setItem('backnode_effective_role', role);
  };

  const setEffectiveDepartment = (dept: string) => {
    setEffectiveDepartmentState(dept);
    localStorage.setItem('backnode_effective_department', dept);
  };

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
        if (currentUser.role && !localStorage.getItem('backnode_effective_role')) {
          setEffectiveRoleState(currentUser.role as UserRole);
        }
        const targetAccountId = currentUser.accountId || currentUser.account?.id;
        if (targetAccountId) {
          const currentSaved = localStorage.getItem('backnode_active_user_space_id');
          if (!currentSaved || currentSaved === 'space-main' || currentSaved === 'space-engineering' || currentSaved === 'space-enterprise') {
            localStorage.setItem('backnode_active_user_space_id', targetAccountId);
          }
        }
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

  const login = async (dto: LoginDto): Promise<AuthResponse> => {
    const res = await authApi.login(dto);
    localStorage.setItem('backnode_token', res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
    if (res.user.role) {
      setEffectiveRoleState(res.user.role as UserRole);
      localStorage.setItem('backnode_effective_role', res.user.role);
    }
    const targetAccountId = res.user.accountId || res.user.account?.id;
    if (targetAccountId) {
      localStorage.setItem('backnode_active_user_space_id', targetAccountId);
    }
    setIsAuthModalOpen(false);
    return res;
  };

  const signup = async (dto: SignupDto): Promise<AuthResponse> => {
    const res = await authApi.signup(dto);
    localStorage.setItem('backnode_token', res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
    if (res.user.role) {
      setEffectiveRoleState(res.user.role as UserRole);
      localStorage.setItem('backnode_effective_role', res.user.role);
    }
    const targetAccountId = res.user.accountId || res.user.account?.id;
    if (targetAccountId) {
      localStorage.setItem('backnode_active_user_space_id', targetAccountId);
    }
    setIsAuthModalOpen(false);
    return res;
  };

  const forgotPassword = async (email: string) => {
    return await authApi.forgotPassword({ email });
  };

  const resetPassword = async (dto: ResetPasswordDto) => {
    return await authApi.resetPassword(dto);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout notification failed:', err);
    } finally {
      localStorage.removeItem('backnode_token');
      localStorage.removeItem('backnode_effective_role');
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
        forgotPassword,
        resetPassword,
        logout,
        effectiveRole,
        setEffectiveRole,
        effectiveDepartment,
        setEffectiveDepartment,
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
