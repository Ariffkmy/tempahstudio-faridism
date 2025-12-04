// =============================================
// BOOKING SERVICE
// =============================================
// Handles booking data operations for the admin dashboard
// All queries are filtered by the admin's studio (RLS enforced)

import { supabase } from '@/lib/supabase';
import type { Booking, BookingWithDetails, Customer, StudioLayout } from '@/types/database';

// =============================================
// GET BOOKINGS
// =============================================

/**
 * Get all bookings for the admin's studio
 */
export async function getStudioBookings(studioId: string): Promise<Booking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('studio_id', studioId)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}

/**
 * Get bookings with customer and layout details
 */
export async function getStudioBookingsWithDetails(studioId: string): Promise<BookingWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(*),
        studio:studios(*),
        studio_layout:studio_layouts(*)
      `)
      .eq('studio_id', studioId)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching bookings with details:', error);
      return [];
    }

    return (data || []) as BookingWithDetails[];
  } catch (error) {
    console.error('Error fetching bookings with details:', error);
    return [];
  }
}

/**
 * Get today's bookings for the admin's studio
 */
export async function getTodayBookings(studioId: string): Promise<Booking[]> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('studio_id', studioId)
      .eq('date', today)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching today bookings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching today bookings:', error);
    return [];
  }
}

/**
 * Get upcoming bookings (from today onwards)
 */
export async function getUpcomingBookings(studioId: string, limit: number = 10): Promise<Booking[]> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('studio_id', studioId)
      .gte('date', today)
      .in('status', ['pending', 'confirmed'])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming bookings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    return [];
  }
}

// =============================================
// STATISTICS
// =============================================

export interface DashboardStats {
  todayBookings: number;
  pendingBookings: number;
  weeklyRevenue: number;
  weeklyBookingsCount: number;
  monthlyCustomers: number;
  upcomingSlots: number;
  tomorrowSlots: number;
}

/**
 * Get dashboard statistics for the admin's studio
 */
export async function getDashboardStats(studioId: string): Promise<DashboardStats> {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Calculate week start (Monday) and end (Sunday)
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);
  const weekStartStr = weekStart.toISOString().split('T')[0];
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  
  // Calculate month start
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartStr = monthStart.toISOString().split('T')[0];
  
  // Tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  try {
    // Get today's bookings
    const { data: todayData } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('studio_id', studioId)
      .eq('date', todayStr);

    const todayBookings = todayData?.length || 0;
    const pendingBookings = todayData?.filter(b => b.status === 'pending').length || 0;

    // Get this week's bookings for revenue
    const { data: weekData } = await supabase
      .from('bookings')
      .select('total_price')
      .eq('studio_id', studioId)
      .gte('date', weekStartStr)
      .lte('date', weekEndStr)
      .in('status', ['confirmed', 'completed']);

    const weeklyRevenue = weekData?.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0) || 0;
    const weeklyBookingsCount = weekData?.length || 0;

    // Get unique customers this month
    const { data: monthData } = await supabase
      .from('bookings')
      .select('customer_id')
      .eq('studio_id', studioId)
      .gte('date', monthStartStr);

    const uniqueCustomers = new Set(monthData?.map(b => b.customer_id) || []);
    const monthlyCustomers = uniqueCustomers.size;

    // Get upcoming bookings count
    const { data: upcomingData } = await supabase
      .from('bookings')
      .select('id, date')
      .eq('studio_id', studioId)
      .gte('date', todayStr)
      .in('status', ['pending', 'confirmed']);

    const upcomingSlots = upcomingData?.length || 0;
    const tomorrowSlots = upcomingData?.filter(b => b.date === tomorrowStr).length || 0;

    return {
      todayBookings,
      pendingBookings,
      weeklyRevenue,
      weeklyBookingsCount,
      monthlyCustomers,
      upcomingSlots,
      tomorrowSlots,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      todayBookings: 0,
      pendingBookings: 0,
      weeklyRevenue: 0,
      weeklyBookingsCount: 0,
      monthlyCustomers: 0,
      upcomingSlots: 0,
      tomorrowSlots: 0,
    };
  }
}

// =============================================
// BOOKING MANAGEMENT
// =============================================

/**
 * Update booking status
 */
export async function updateBookingStatus(
  bookingId: string,
  status: Booking['status']
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating booking status:', error);
    return { success: false, error: 'Gagal mengemaskini status tempahan' };
  }
}

/**
 * Add internal notes to a booking
 */
export async function updateBookingNotes(
  bookingId: string,
  internalNotes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ internal_notes: internalNotes })
      .eq('id', bookingId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating booking notes:', error);
    return { success: false, error: 'Gagal mengemaskini nota tempahan' };
  }
}

// =============================================
// LAYOUTS
// =============================================

/**
 * Get studio layouts for the admin's studio
 */
export async function getStudioLayouts(studioId: string): Promise<StudioLayout[]> {
  try {
    const { data, error } = await supabase
      .from('studio_layouts')
      .select('*')
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching studio layouts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching studio layouts:', error);
    return [];
  }
}
