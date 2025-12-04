// =============================================
// AUTH CONTEXT
// =============================================
// Provides authentication state and methods throughout the app
// Key: Admin users can only access their own studio's data

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdminUserWithStudio, Studio, AuthState } from '@/types/database';
import { supabase } from '@/lib/supabase';
import {
  getCurrentAdmin,
  loginAdmin,
  logoutAdmin,
  registerAdmin,
  onAuthStateChange,
} from '@/services/adminAuth';
import type { AdminRegistrationData, AdminLoginData } from '@/types/database';

// =============================================
// CONTEXT TYPES
// =============================================

interface AuthContextType extends AuthState {
  login: (data: AdminLoginData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: AdminRegistrationData) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const defaultAuthState: AuthState = {
  user: null,
  studio: null,
  isLoading: true,
  isAuthenticated: false,
};

// =============================================
// CONTEXT CREATION
// =============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================
// AUTH PROVIDER COMPONENT
// =============================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);
  const initialLoadDone = useRef(false);
  const isProcessing = useRef(false);

  // =============================================
  // FETCH CURRENT USER
  // =============================================
  const fetchCurrentUser = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isProcessing.current) {
      console.log('fetchCurrentUser: Already processing, skipping...');
      return;
    }
    
    isProcessing.current = true;
    
    try {
      console.log('fetchCurrentUser: Starting...');
      const adminUser = await getCurrentAdmin();
      console.log('fetchCurrentUser: Result:', adminUser?.email || 'null');
      
      if (adminUser) {
        setAuthState({
          user: adminUser,
          studio: adminUser.studio as Studio,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          studio: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('fetchCurrentUser: Error:', error);
      setAuthState({
        user: null,
        studio: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } finally {
      isProcessing.current = false;
    }
  }, []);

  // =============================================
  // AUTH STATE LISTENER
  // =============================================
  useEffect(() => {
    // Initial load - check for existing session
    const initializeAuth = async () => {
      if (initialLoadDone.current) return;
      initialLoadDone.current = true;

      console.log('AuthContext: Initializing...');

      // Check if there's an existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // There's a session, fetch user data
        await fetchCurrentUser();
      } else {
        // No session, show login page
        setAuthState({
          user: null,
          studio: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };
    
    initializeAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'has session' : 'no session');

      // Only handle explicit auth events, not INITIAL_SESSION
      if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          studio: null,
          isLoading: false,
          isAuthenticated: false,
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Token refreshed, update user data
        await fetchCurrentUser();
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchCurrentUser]);

  // =============================================
  // LOGIN
  // =============================================
  const login = async (data: AdminLoginData): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    const result = await loginAdmin(data);

    if (result.success && result.user) {
      setAuthState({
        user: result.user,
        studio: result.user.studio as Studio,
        isLoading: false,
        isAuthenticated: true,
      });
      return { success: true };
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: result.error };
    }
  };

  // =============================================
  // LOGOUT
  // =============================================
  const logout = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    await logoutAdmin();
    
    setAuthState({
      user: null,
      studio: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  // =============================================
  // REGISTER
  // =============================================
  const register = async (data: AdminRegistrationData): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    const result = await registerAdmin(data);

    if (result.success) {
      // Don't auto-login after registration, just return success
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: true };
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: result.error };
    }
  };

  // =============================================
  // REFRESH USER
  // =============================================
  const refreshUser = async (): Promise<void> => {
    await fetchCurrentUser();
  };

  // =============================================
  // CONTEXT VALUE
  // =============================================
  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    register,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================
// USE AUTH HOOK
// =============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// =============================================
// PROTECTED ROUTE COMPONENT
// =============================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = '/admin/login' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, don't render children (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// =============================================
// REQUIRE STUDIO ACCESS HOC
// =============================================
// Ensures admin can only access their own studio's data

interface RequireStudioAccessProps {
  children: React.ReactNode;
  studioId: string;
}

export function RequireStudioAccess({ children, studioId }: RequireStudioAccessProps) {
  const { studio, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && studio && studio.id !== studioId) {
      // Admin trying to access another studio's data - redirect to their own dashboard
      navigate('/admin', { replace: true });
    }
  }, [studio, studioId, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only render if admin has access to this studio
  if (studio?.id !== studioId) {
    return null;
  }

  return <>{children}</>;
}
