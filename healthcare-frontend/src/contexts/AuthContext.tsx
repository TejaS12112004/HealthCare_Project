import React, {
  createContext,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';
import type { AuthResponse, LoginRequest, Role, User } from '../types/auth';

const KEYS = {
  ACCESS: 'hc_access_token',
  REFRESH: 'hc_refresh_token',
  USER: 'hc_user',
};

// ── Context shape ─────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  role: Role | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const [state, setState] = useState<AuthState>(() => {
    // Rehydrate from localStorage on page load
    try {
      const token = localStorage.getItem(KEYS.ACCESS);
      const raw = localStorage.getItem(KEYS.USER);
      const user: User | null = raw ? JSON.parse(raw) : null;
      return {
        user,
        accessToken: token,
        isAuthenticated: !!token && !!user,
        role: user?.role ?? null,
        isLoading: false,
      };
    } catch {
      return { user: null, accessToken: null, isAuthenticated: false, role: null, isLoading: false };
    }
  });

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const { data } = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      } satisfies LoginRequest);

      localStorage.setItem(KEYS.ACCESS, data.accessToken);
      localStorage.setItem(KEYS.REFRESH, data.refreshToken);
      localStorage.setItem(KEYS.USER, JSON.stringify(data.user));

      setState({
        user: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
        role: data.user.role,
        isLoading: false,
      });

      // Redirect to the right portal
      const dest =
        data.user.role === 'PATIENT'
          ? '/patient/dashboard'
          : data.user.role === 'DOCTOR'
          ? '/doctor/dashboard'
          : '/admin/doctors';
      navigate(dest, { replace: true });
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false }));
      throw err;
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem(KEYS.ACCESS);
    localStorage.removeItem(KEYS.REFRESH);
    localStorage.removeItem(KEYS.USER);
    setState({ user: null, accessToken: null, isAuthenticated: false, role: null, isLoading: false });
    navigate('/login', { replace: true });
  }, [navigate]);

  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem(KEYS.REFRESH);
    if (!refresh) { logout(); return; }
    try {
      const { data } = await apiClient.get<AuthResponse>(ENDPOINTS.AUTH.REFRESH, {
        headers: { Authorization: `Bearer ${refresh}` },
      });
      localStorage.setItem(KEYS.ACCESS, data.accessToken);
      setState((s) => ({ ...s, accessToken: data.accessToken }));
    } catch {
      logout();
    }
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, refreshToken }),
    [state, login, logout, refreshToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
