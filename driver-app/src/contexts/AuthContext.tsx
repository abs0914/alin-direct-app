// ============================================================
// ALiN Direct Driver App - Authentication Context
// ============================================================
// MOCK: Demo mode auto-authenticates with hardcoded rider.
// PRODUCTION: Set DEMO_MODE = false to use Supabase auth flow.

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../services/api';
import { User, Rider } from '../types';
import { MOCK_USER, MOCK_RIDER } from '../data/mockData';

// ---- DEMO FLAG ----
// MOCK: Set to true for offline demo. PRODUCTION: Set to false.
const DEMO_MODE = true;

interface AuthState {
  user: User | null;
  rider: Rider | null;
  session: unknown;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  register: (data: { name: string; phone: string; vehicle_type: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    rider: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    if (DEMO_MODE) {
      // Auto-login with mock data after a brief splash
      const timer = setTimeout(() => {
        setState({
          user: MOCK_USER,
          rider: { ...MOCK_RIDER },
          session: { demo: true },
          isLoading: false,
          isAuthenticated: true,
        });
      }, 800);
      return () => clearTimeout(timer);
    }

    // PRODUCTION: Supabase auth flow (preserved for Sprint 3+)
    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  const requestOtp = useCallback(async (_phone: string) => {
    if (DEMO_MODE) return;
  }, []);

  const verifyOtp = useCallback(async (_phone: string, _otp: string) => {
    if (DEMO_MODE) {
      setState({
        user: MOCK_USER,
        rider: { ...MOCK_RIDER },
        session: { demo: true },
        isLoading: false,
        isAuthenticated: true,
      });
      return;
    }
  }, []);

  const register = useCallback(
    async (_regData: { name: string; phone: string; vehicle_type: string }) => {
      if (DEMO_MODE) return;
    },
    []
  );

  const logout = useCallback(async () => {
    setState({
      user: null,
      rider: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profileData = await api.getProfile();
      setState((prev) => ({ ...prev, user: profileData.user, rider: profileData.rider }));
    } catch {
      // Silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        requestOtp,
        verifyOtp,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

