import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Studio } from '@/types/database';
import { useAuth } from './AuthContext';

// =============================================
// STUDIO CONTEXT
// =============================================
// Manages the currently selected studio for super admin studio switching

export interface StudioContextType {
  studios: Studio[];
  selectedStudioId: string | null;
  selectedStudio: Studio | null;
  setSelectedStudioId: (studioId: string | null) => void;
  loading: boolean;
  refreshStudios: () => Promise<void>;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

// =============================================
// STUDIO PROVIDER COMPONENT
// =============================================

interface StudioProviderProps {
  children: React.ReactNode;
}

export function StudioProvider({ children }: StudioProviderProps) {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();

  // Only initialize for super admins to avoid unnecessary API calls
  const isInitialized = isSuperAdmin && !authLoading;

  const [studios, setStudios] = useState<Studio[]>([]);
  const [selectedStudioId, setSelectedStudioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get selected studio object
  const selectedStudio = studios.find(s => s.id === selectedStudioId) || null;

  // Load studios when user is super admin
  const refreshStudios = async () => {
    if (!isSuperAdmin) return;

    setLoading(true);
    try {
      // This will use RLS policies - super admins can see all studios
      const studiosData = await import('@/services/adminAuth').then(
        ({ getAvailableStudios }) => getAvailableStudios()
      );

      setStudios(studiosData);

      // Auto-select first studio if none selected and studios are loaded
      if (studiosData.length > 0 && !selectedStudioId) {
        setSelectedStudioId(studiosData[0].id);
      }
    } catch (error) {
      console.error('Error refreshing studios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize when user becomes super admin
  useEffect(() => {
    if (isInitialized) {
      refreshStudios();
    } else {
      // Reset state for non-super admins
      setStudios([]);
      setSelectedStudioId(null);
      setLoading(false);
    }
  }, [isInitialized]);

  // Handle studio selection changes
  const handleSetSelectedStudioId = (studioId: string | null) => {
    setSelectedStudioId(studioId);

    // Persist selection in localStorage for session continuity
    if (studioId && isSuperAdmin) {
      localStorage.setItem('superAdminSelectedStudioId', studioId);
    } else {
      localStorage.removeItem('superAdminSelectedStudioId');
    }
  };

  // Restore selection on component mount
  useEffect(() => {
    if (isInitialized) {
      const savedStudioId = localStorage.getItem('superAdminSelectedStudioId');
      if (savedStudioId) {
        setSelectedStudioId(savedStudioId);
      }
    }
  }, [isInitialized]);

  const value: StudioContextType = {
    studios,
    selectedStudioId,
    selectedStudio,
    setSelectedStudioId: handleSetSelectedStudioId,
    loading,
    refreshStudios,
  };

  return (
    <StudioContext.Provider value={value}>
      {children}
    </StudioContext.Provider>
  );
}

// =============================================
// USE STUDIO HOOK
// =============================================

export function useStudio(): StudioContextType {
  const context = useContext(StudioContext);

  if (context === undefined) {
    throw new Error('useStudio must be used within a StudioProvider');
  }

  return context;
}

// =============================================
// GET EFFECTIVE STUDIO ID HOOK
// =============================================
// Gets the studio ID to use for data fetching (selected for super admin, assigned for regular admin)

export function useEffectiveStudioId(): string | undefined {
  const { selectedStudioId, loading: studioLoading } = useStudio();
  const { studio, isSuperAdmin, isLoading: authLoading } = useAuth();

  // Don't return anything while loading
  if (authLoading || (isSuperAdmin && studioLoading)) {
    return undefined;
  }

  // For super admins: use selected studio, fallback to first available or assigned
  if (isSuperAdmin) {
    return selectedStudioId || studio?.id;
  }

  // For regular admins: always use their assigned studio
  return studio?.id;
}
