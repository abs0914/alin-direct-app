// ============================================================
// ALiN Move Customer App - Authentication Context
// ============================================================
// Uses Supabase Phone OTP auth. On successful verification,
// fetches customer profile from Laravel backend (auto-provisioned
// by SupabaseAuth middleware).

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import api from '../services/api';
import { User, Customer } from '../types';
import { Session } from '@supabase/supabase-js';

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
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
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
      const { user, customer } = await api.registerCustomer(regData);
      setState(prev => ({ ...prev, user, customer }));
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      customer: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const refreshProfile = useCallback(async () => {
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

