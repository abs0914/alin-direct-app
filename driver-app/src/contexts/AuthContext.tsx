// ============================================================
// ALiN Move Driver App - Authentication Context
// ============================================================
// DEMO_MODE: true  → bypasses Supabase SMS and accepts any 6-digit OTP locally
// DEMO_MODE: false → real Supabase Phone OTP auth

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import api from '../services/api';
import Config from '../config';
import { User, Rider } from '../types';
import { Session } from '@supabase/supabase-js';
import { MOCK_USER, MOCK_RIDER } from '../data/mockData';

// ---- DEMO FLAG ----
export const OTP_TEST_MODE = Config.DEMO_MODE; // Set to false when Supabase is running

const createDemoUser = (phone: string): User => ({
  ...MOCK_USER,
  phone,
});

const createDemoRider = (phone: string): Rider => {
  const user = createDemoUser(phone);

  MOCK_RIDER.availability = 'offline';
  MOCK_RIDER.maya_phone = phone;
  MOCK_RIDER.user = user;

  return MOCK_RIDER;
};

interface AuthState {
  user: User | null;
  rider: Rider | null;
  session: Session | unknown;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  register: (data: { name: string; vehicle_type: string; plate_number?: string }) => Promise<void>;
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

  // Fetch rider profile from backend once we have a session
  const loadProfile = useCallback(async (session: Session) => {
    try {
      const { user, rider } = await api.getProfile();
      setState({
        user,
        rider,
        session,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      setState({
        user: null,
        rider: null,
        session,
        isLoading: false,
        isAuthenticated: true,
      });
    }
  }, []);

  // Bootstrap
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadProfile(session);
      } else {
        setState({
          user: null,
          rider: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const requestOtp = useCallback(async (_phone: string) => {
    if (OTP_TEST_MODE) return; // skip — no real SMS in local test mode
    const { error } = await supabase.auth.signInWithOtp({ phone: _phone });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (_phone: string, _otp: string) => {
    if (OTP_TEST_MODE) {
      const user = createDemoUser(_phone);

      setState({
        user,
        rider: createDemoRider(_phone),
        session: { demo: true },
        isLoading: false,
        isAuthenticated: true,
      });
      return;
    }
    const { error } = await supabase.auth.verifyOtp({
      phone: _phone,
      token: _otp,
      type: 'sms',
    });
    if (error) throw error;
  }, []);

  const register = useCallback(
    async (_regData: { name: string; vehicle_type: string; plate_number?: string }) => {
      if (OTP_TEST_MODE) {
        setState({
          user: createDemoUser(MOCK_USER.phone),
          rider: createDemoRider(MOCK_USER.phone),
          session: { demo: true },
          isLoading: false,
          isAuthenticated: true,
        });
        return;
      }
      const { user, rider } = await api.registerRider(_regData);
      setState(prev => ({ ...prev, user, rider }));
    },
    []
  );

  const logout = useCallback(async () => {
    if (!OTP_TEST_MODE) {
      await supabase.auth.signOut();
    }
    MOCK_RIDER.availability = 'offline';
    setState({
      user: null,
      rider: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (OTP_TEST_MODE) return;
    try {
      const profileData = await api.getProfile();
      setState(prev => ({ ...prev, user: profileData.user, rider: profileData.rider }));
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

