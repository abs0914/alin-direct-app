// ============================================================
// ALiN Move Customer App - Authentication Context
// ============================================================
// OTP_TEST_MODE: true  → bypasses Supabase SMS and accepts any 6-digit OTP locally.
// OTP_TEST_MODE: false → real Supabase Phone OTP auth.

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import api from '../services/api';
import { User, Customer } from '../types';
import { Session } from '@supabase/supabase-js';
import { MOCK_USER, MOCK_CUSTOMER } from '../data/mockData';
import { resetDemoState } from '../store/jobStore';
import { resetSupportState } from '../store/supportStore';

export const OTP_TEST_MODE = true; // Set to false when Supabase is running

const createDemoUser = (phone: string): User => ({
  ...MOCK_USER,
  phone,
});

const createDemoCustomer = (): Customer => ({
  ...MOCK_CUSTOMER,
});

interface AuthState {
  user: User | null;
  customer: Customer | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  register: (data: { name: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    customer: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Fetch customer profile from backend once we have a session
  const loadProfile = useCallback(async (session: Session) => {
    try {
      const { user, customer } = await api.getProfile();
      setState({
        user,
        customer,
        session,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      // Session exists but no customer profile yet (new user)
      setState({
        user: null,
        customer: null,
        session,
        isLoading: false,
        isAuthenticated: true,
      });
    }
  }, []);

  // Bootstrap: check existing session on mount
  useEffect(() => {
    if (OTP_TEST_MODE) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadProfile(session);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadProfile(session);
      } else {
        setState({
          user: null,
          customer: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const requestOtp = useCallback(async (phone: string) => {
    if (OTP_TEST_MODE) return;

    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    if (OTP_TEST_MODE) {
      setState({
        user: createDemoUser(phone),
        customer: createDemoCustomer(),
        session: { demo: true },
        isLoading: false,
        isAuthenticated: true,
      });
      return;
    }

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });
    if (error) throw error;
    // onAuthStateChange will handle the rest
  }, []);

  const register = useCallback(
    async (regData: { name: string; email?: string }) => {
      if (OTP_TEST_MODE) {
        setState({
          user: {
            ...createDemoUser(MOCK_USER.phone),
            name: regData.name,
            email: regData.email ?? null,
          },
          customer: createDemoCustomer(),
          session: { demo: true },
          isLoading: false,
          isAuthenticated: true,
        });
        return;
      }

      const { user, customer } = await api.registerCustomer(regData);
      setState(prev => ({ ...prev, user, customer }));
    },
    []
  );

  const logout = useCallback(async () => {
    if (!OTP_TEST_MODE) {
      await supabase.auth.signOut();
    }

    // Reset in-memory demo state for a clean next session
    resetDemoState();
    resetSupportState();

    setState({
      user: null,
      customer: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (OTP_TEST_MODE) return;

    try {
      const profileData = await api.getProfile();
      setState(prev => ({ ...prev, user: profileData.user, customer: profileData.customer }));
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

