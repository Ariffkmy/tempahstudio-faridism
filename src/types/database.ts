// =============================================
// DATABASE TYPES - Generated for Supabase Tables
// =============================================

export type AdminRole = 'super_admin' | 'admin' | 'staff';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';

// Opening Hours type used across tables
export interface OpeningHours {
  [day: string]: { open: string; close: string } | null;
}

// =============================================
// COMPANIES TABLE
// =============================================
export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  timezone: string;
  min_booking_duration: number;
  max_booking_duration: number;
  buffer_time: number;
  opening_hours: OpeningHours;
  created_at: string;
  updated_at: string;
}

export type CompanyInsert = Omit<Company, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CompanyUpdate = Partial<CompanyInsert>;

// =============================================
// STUDIOS TABLE
// =============================================
export interface Studio {
  id: string;
  company_id: string;
  name: string;
  location?: string | null;
  description?: string | null;
  image?: string | null;
  opening_hours: OpeningHours;
  email?: string | null;
  google_maps_link?: string | null;
  waze_link?: string | null;
  bank_account_number?: string | null;
  account_owner_name?: string | null;
  qr_code?: string | null;
  booking_link?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type StudioInsert = Omit<Studio, 'id' | 'created_at' | 'updated_at' | 'is_active'> & {
  id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type StudioUpdate = Partial<Omit<StudioInsert, 'company_id'>>;

// Studio with related data (for frontend use)
export interface StudioWithLayouts extends Studio {
  studio_layouts: StudioLayout[];
}

// =============================================
// STUDIO LAYOUTS TABLE
// =============================================
export interface StudioLayout {
  id: string;
  studio_id: string;
  name: string;
  description?: string | null;
  capacity: number;
  price_per_hour: number;
  image?: string | null;
  amenities: string[];
  configured_time_slots: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type StudioLayoutInsert = Omit<StudioLayout, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'amenities' | 'configured_time_slots'> & {
  id?: string;
  is_active?: boolean;
  amenities?: string[];
  configured_time_slots?: string[];
  created_at?: string;
  updated_at?: string;
};

export type StudioLayoutUpdate = Partial<StudioLayoutInsert>;

// =============================================
// ADMIN USERS TABLE
// =============================================
export interface AdminUser {
  id: string;
  auth_user_id: string;
  studio_id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: AdminRole;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type AdminUserInsert = Omit<AdminUser, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'last_login_at'> & {
  id?: string;
  is_active?: boolean;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type AdminUserUpdate = Partial<Omit<AdminUserInsert, 'auth_user_id' | 'email'>>;

// Admin user with related studio data
export interface AdminUserWithStudio extends AdminUser {
  studio: Studio;
}

// =============================================
// CUSTOMERS TABLE
// =============================================
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CustomerUpdate = Partial<CustomerInsert>;

// =============================================
// BOOKINGS TABLE
// =============================================
export interface Booking {
  id: string;
  reference: string;
  customer_id: string;
  company_id: string;
  studio_id: string;
  layout_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  total_price: number;
  status: BookingStatus;
  notes?: string | null;
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type BookingInsert = Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'reference'> & {
  id?: string;
  reference?: string;
  created_at?: string;
  updated_at?: string;
};

export type BookingUpdate = Partial<Omit<BookingInsert, 'customer_id' | 'company_id' | 'studio_id' | 'layout_id'>>;

// Booking with related data (for display)
export interface BookingWithDetails extends Booking {
  customer: Customer;
  studio: Studio;
  studio_layout: StudioLayout;
}

// =============================================
// AUTH TYPES
// =============================================
export interface AdminRegistrationData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  studio_name: string;
  studio_location?: string;
}

export interface AdminLoginData {
  email: string;
  password: string;
}

export interface AuthState {
  user: AdminUser | null;
  studio: Studio | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// =============================================
// DATABASE SCHEMA TYPE (for Supabase client)
// =============================================
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: CompanyInsert;
        Update: CompanyUpdate;
      };
      studios: {
        Row: Studio;
        Insert: StudioInsert;
        Update: StudioUpdate;
      };
      studio_layouts: {
        Row: StudioLayout;
        Insert: StudioLayoutInsert;
        Update: StudioLayoutUpdate;
      };
      admin_users: {
        Row: AdminUser;
        Insert: AdminUserInsert;
        Update: AdminUserUpdate;
      };
      customers: {
        Row: Customer;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
      };
      bookings: {
        Row: Booking;
        Insert: BookingInsert;
        Update: BookingUpdate;
      };
    };
    Functions: {
      get_admin_studio: {
        Args: { user_auth_id: string };
        Returns: string;
      };
      is_admin_of_studio: {
        Args: { user_auth_id: string; check_studio_id: string };
        Returns: boolean;
      };
      generate_booking_reference: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
}
