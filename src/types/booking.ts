export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';

export interface StudioLayout {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  image?: string;
  amenities: string[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Booking {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyId: string;
  studioId: string;
  layoutId: string;
  layoutName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalPrice: number;
  status: BookingStatus;
  notes?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  timezone: string;
  openingHours: {
    [day: string]: { open: string; close: string } | null;
  };
  minBookingDuration: number;
  maxBookingDuration: number;
  bufferTime: number;
}
