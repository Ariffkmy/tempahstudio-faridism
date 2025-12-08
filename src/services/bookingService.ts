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
    // Get booking details before update for email notification
    const { data: bookingBefore } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(*),
        studio:studios(*)
      `)
      .eq('id', bookingId)
      .single();

    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Send status update email notification
    if (bookingBefore) {
      try {
        const { sendBookingStatusEmail } = await import('@/services/emailService');

        await sendBookingStatusEmail(bookingBefore.customer.email, {
          reference: bookingBefore.reference,
          customer_name: bookingBefore.customer.name,
          studio_name: bookingBefore.studio?.name || 'Studio Raya',
          old_status: bookingBefore.status,
          new_status: status,
        });
      } catch (emailError) {
        console.error('Failed to send booking status update email:', emailError);
        // Don't fail status update if email fails
        // This is logged but doesn't prevent the status update from succeeding
      }
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
// BOOKING CREATION (Public)
// =============================================

export interface CreateBookingData {
  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone?: string;

  // Booking details
  studioId: string;
  layoutId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalPrice: number;

  // Optional
  notes?: string;
  paymentMethod?: string;
}

/**
 * Create a new booking from public booking form
 */
export async function createPublicBooking(bookingData: CreateBookingData): Promise<{ success: boolean; booking?: any; error?: string }> {
  try {
    // First, get studio and company info
    const { data: studio, error: studioError } = await supabase
      .from('studios')
      .select('id, company_id, name')
      .eq('id', bookingData.studioId)
      .eq('is_active', true)
      .single();

    if (studioError || !studio) {
      return { success: false, error: 'Studio tidak dijumpai' };
    }

    // Check if customer already exists
    let customerId: string;
    const { data: existingCustomer, error: customerLookupError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', bookingData.customerEmail)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer, error: customerCreateError } = await supabase
        .from('customers')
        .insert({
          name: bookingData.customerName,
          email: bookingData.customerEmail,
          phone: bookingData.customerPhone || null,
        })
        .select('id')
        .single();

      if (customerCreateError || !newCustomer) {
        console.error('Error creating customer:', customerCreateError);
        return { success: false, error: 'Gagal membuat rekod pelanggan' };
      }

      customerId = newCustomer.id;
    }

    // Generate booking reference using the database function
    const { data: referenceData, error: referenceError } = await supabase
      .rpc('generate_booking_reference');

    if (referenceError || !referenceData) {
      console.error('Error generating booking reference:', referenceError);
      return { success: false, error: 'Gagal menjana rujukan tempahan' };
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        reference: referenceData,
        customer_id: customerId,
        company_id: studio.company_id,
        studio_id: bookingData.studioId,
        layout_id: bookingData.layoutId,
        date: bookingData.date,
        start_time: bookingData.startTime,
        end_time: bookingData.endTime,
        duration: bookingData.duration,
        total_price: bookingData.totalPrice,
        status: 'pending',
        notes: bookingData.notes || null,
      })
      .select(`
        *,
        customer:customers(*),
        studio:studios(*),
        studio_layout:studio_layouts(*)
      `)
      .single();

    if (bookingError || !booking) {
      console.error('Error creating booking:', bookingError);
      return { success: false, error: 'Gagal membuat tempahan' };
    }

    // Try to create calendar event if Google Calendar is enabled
    try {
      if (booking.studio?.google_calendar_enabled) {
        await createCalendarEvent(booking);
      }
    } catch (calendarError) {
      console.error('Failed to create calendar event:', calendarError);
      // Don't fail the booking if calendar integration fails
      // This is logged but doesn't prevent the booking from succeeding
    }

    // Send booking confirmation email
    try {
      const { sendBookingConfirmationEmail, sendAdminBookingAlert } = await import('@/services/emailService');

      // Send customer confirmation email
      await sendBookingConfirmationEmail(booking.customer.email, {
        reference: booking.reference,
        customer_name: booking.customer.name,
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        studio_name: booking.studio.name,
        layout_name: booking.studio_layout.name,
        total_price: booking.total_price,
        duration: booking.duration,
      });

      // Send admin alert email (if enabled, will be checked by the service)
      try {
        // Get studio admin emails for alerts
        const studioId = booking.studio_id;
        const { data: studioAdmins } = await supabase
          .from('admin_users')
          .select('email, full_name')
          .eq('studio_id', studioId)
          .eq('is_active', true);

        if (studioAdmins && studioAdmins.length > 0) {
          // Send alert to first admin (can be enhanced to send to all or use preferences)
          const admin = studioAdmins[0];
          await sendAdminBookingAlert(admin.email, {
            reference: booking.reference,
            customer_name: booking.customer.name,
            customer_email: booking.customer.email,
            date: booking.date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            studio_name: booking.studio.name,
            total_price: booking.total_price,
            duration: booking.duration,
          });
        }
      } catch (adminEmailError) {
        console.error('Failed to send admin booking alert:', adminEmailError);
        // Don't fail booking if admin email fails
      }
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
      // Don't fail booking if email fails
      // This is logged but doesn't prevent the booking from succeeding
    }

    return { success: true, booking };
  } catch (error) {
    console.error('Error in createPublicBooking:', error);
    return { success: false, error: 'Ralat tidak dijangka berlaku' };
  }
}

// =============================================
// GOOGLE CALENDAR INTEGRATION
// =============================================

/**
 * Create a Google Calendar event for a booking
 */
async function createCalendarEvent(booking: BookingWithDetails): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    // Get the layout details for the event title
    const layout = booking.studio_layout;
    if (!layout) {
      throw new Error('Layout information missing');
    }

    const eventData = {
      studioId: booking.studio_id,
      bookingDate: booking.date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      customerName: booking.customer.name,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone || '',
      layoutName: layout.name,
      notes: booking.notes,
      bookingReference: booking.reference,
      calendarSecretKey: 'waOOzgPpFwaySuO4xTwLBx74QgJ9P9jT'
    };

    const { data, error } = await supabase.functions.invoke('create-calendar-event', {
      body: eventData
    });

    if (error) {
      throw new Error(`Calendar integration failed: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Unknown calendar error');
    }

    console.log('Calendar event created successfully:', data.calendarEvent);
  } catch (error) {
    console.error('Error in createCalendarEvent:', error);
    throw error;
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
