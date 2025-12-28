export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'done-payment'
  | 'done-photoshoot'
  | 'start-editing'
  | 'ready-for-delivery'
  | 'completed'
  | 'rescheduled'
  | 'no-show'
  | 'cancelled';

export interface StudioLayout {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  minute_package?: number;
  image?: string;
  thumbnail_photo?: string;
  amenities?: string[];
  layout_photos?: string[];
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
  deliveryLink?: string;
  addonPackageId?: string; // References addon_packages table
  photographerId?: string;
  editorId?: string;
  photographerName?: string; // For display purposes
  editorName?: string; // For display purposes
  createdAt: string;
  updatedAt: string;
}

export interface AddonPackage {
  id: string;
  studio_id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Studio {
  id: string;
  name: string;
  location: string;
  description: string;
  image?: string;
  layouts: StudioLayout[];
  openingHours: {
    [day: string]: { open: string; close: string } | null;
  };
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
