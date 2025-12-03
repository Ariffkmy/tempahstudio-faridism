import { StudioLayout, Booking, Company, Studio } from '@/types/booking';

export const mockLayouts: StudioLayout[] = [
  {
    id: 'classic',
    name: 'Studio Klasik',
    description: 'Persediaan klasik dengan pencahayaan profesional dan pilihan latar belakang. Sempurna untuk potret dan fotografi produk.',
    capacity: 6,
    pricePerHour: 150,
    image: '/placeholder.svg',
    amenities: [],
  },
  {
    id: 'premium',
    name: 'Studio Minimalist',
    description: 'Studio bendera kami dengan peralatan canggih dan persekitaran luas. Ideal untuk penggambaran komersial dan pengeluaran video.',
    capacity: 12,
    pricePerHour: 280,
    image: '/placeholder.svg',
    amenities: [],
  },
  {
    id: 'openspace',
    name: 'Studio Moden',
    description: 'Ruang kreatif serba boleh dengan cahaya semula jadi. Bagus untuk penggambaran gaya hidup, sesi yoga, dan acara kecil.',
    capacity: 20,
    pricePerHour: 200,
    image: '/placeholder.svg',
    amenities: [],
  },
];

// Admin-configurable time slots - if empty, all slots are available
// When admin enables slot configuration, only these slots will be shown
export const configuredTimeSlots: { [layoutId: string]: string[] } = {
  // Example: 'classic': ['09:00', '10:00', '14:00', '15:00'],
  // Empty means all default slots are available
};

// Default operating hours
export const defaultOperatingHours = {
  start: 9,
  end: 21,
};

export const mockStudios: Studio[] = [
  {
    id: 'studio-1',
    name: 'Raya Studio KL Main',
    location: 'Kuala Lumpur City Centre',
    description: 'Studio utama kami di tengah bandar dengan akses mudah dan peralatan lengkap.',
    image: '/placeholder.svg',
    layouts: mockLayouts,
    openingHours: {
      monday: { open: '09:00', close: '21:00' },
      tuesday: { open: '09:00', close: '21:00' },
      wednesday: { open: '09:00', close: '21:00' },
      thursday: { open: '09:00', close: '21:00' },
      friday: { open: '09:00', close: '21:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: null,
    },
  },
  {
    id: 'studio-2',
    name: 'Raya Studio Bangsar',
    location: 'Bangsar, Kuala Lumpur',
    description: 'Studio moden di kawasan Bangsar yang popular dengan artis dan pengarah.',
    image: '/placeholder.svg',
    layouts: mockLayouts.slice(0, 2), // Only classic and premium
    openingHours: {
      monday: { open: '09:00', close: '21:00' },
      tuesday: { open: '09:00', close: '21:00' },
      wednesday: { open: '09:00', close: '21:00' },
      thursday: { open: '09:00', close: '21:00' },
      friday: { open: '09:00', close: '21:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { open: '12:00', close: '18:00' },
    },
  },
  {
    id: 'studio-3',
    name: 'Raya Studio Cheras',
    location: 'Cheras, Kuala Lumpur',
    description: 'Studio komuniti mesra di Cheras, sesuai untuk projek tempatan dan sesi keluarga.',
    image: '/placeholder.svg',
    layouts: [mockLayouts[0], mockLayouts[2]], // Classic and openspace
    openingHours: {
      monday: { open: '09:00', close: '21:00' },
      tuesday: { open: '09:00', close: '21:00' },
      wednesday: { open: '09:00', close: '21:00' },
      thursday: { open: '09:00', close: '21:00' },
      friday: { open: '09:00', close: '21:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: null,
    },
  },
];

export const mockCompany: Company = {
  id: 'raya-kl',
  name: 'Raya Studio KL',
  slug: 'raya-kl',
  timezone: 'Asia/Kuala_Lumpur',
  openingHours: {
    monday: { open: '09:00', close: '21:00' },
    tuesday: { open: '09:00', close: '21:00' },
    wednesday: { open: '09:00', close: '21:00' },
    thursday: { open: '09:00', close: '21:00' },
    friday: { open: '09:00', close: '21:00' },
    saturday: { open: '10:00', close: '18:00' },
    sunday: null,
  },
  minBookingDuration: 1,
  maxBookingDuration: 8,
  bufferTime: 30,
};

export const mockBookings: Booking[] = [
  {
    id: '1',
    reference: 'RAYA-2024-001',
    customerId: 'c1',
    customerName: 'Sarah Chen',
    customerEmail: 'sarah@example.com',
    customerPhone: '+60123456789',
    companyId: 'raya-kl',
    studioId: 'studio-1',
    layoutId: 'premium',
    layoutName: 'Studio Minimalist',
    date: '2024-12-05',
    startTime: '10:00',
    endTime: '14:00',
    duration: 4,
    totalPrice: 1120,
    status: 'confirmed',
    notes: 'Gambar potret korporat untuk 8 ahli pasukan',
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '2',
    reference: 'RAYA-2024-002',
    customerId: 'c2',
    customerName: 'Marcus Wong',
    customerEmail: 'marcus@example.com',
    customerPhone: '+60198765432',
    companyId: 'raya-kl',
    studioId: 'studio-1',
    layoutId: 'classic',
    layoutName: 'Studio Klasik',
    date: '2024-12-06',
    startTime: '14:00',
    endTime: '17:00',
    duration: 3,
    totalPrice: 450,
    status: 'pending',
    createdAt: '2024-12-02T14:00:00Z',
    updatedAt: '2024-12-02T14:00:00Z',
  },
  {
    id: '3',
    reference: 'RAYA-2024-003',
    customerId: 'c3',
    customerName: 'Aisha Rahman',
    customerEmail: 'aisha@example.com',
    customerPhone: '+60112223344',
    companyId: 'raya-kl',
    studioId: 'studio-1',
    layoutId: 'openspace',
    layoutName: 'Studio Moden',
    date: '2024-12-07',
    startTime: '09:00',
    endTime: '12:00',
    duration: 3,
    totalPrice: 600,
    status: 'confirmed',
    notes: 'Sesi fotografi yoga untuk jenama kesejahteraan',
    createdAt: '2024-12-03T09:00:00Z',
    updatedAt: '2024-12-03T09:00:00Z',
  },
  {
    id: '4',
    reference: 'RAYA-2025-001',
    customerId: 'c4',
    customerName: 'Ahmad bin Abdullah',
    customerEmail: 'ahmad@example.com',
    customerPhone: '+60113334455',
    companyId: 'raya-kl',
    studioId: 'studio-1',
    layoutId: 'premium',
    layoutName: 'Studio Minimalist',
    date: '2025-12-05',
    startTime: '10:00',
    endTime: '14:00',
    duration: 4,
    totalPrice: 1120,
    status: 'confirmed',
    notes: 'Sesi fotografi majlis perkahwinan',
    createdAt: '2025-11-25T10:00:00Z',
    updatedAt: '2025-11-25T10:00:00Z',
  },
  {
    id: '5',
    reference: 'RAYA-2025-002',
    customerId: 'c5',
    customerName: 'Siti Nurhaliza',
    customerEmail: 'siti@example.com',
    customerPhone: '+60114445566',
    companyId: 'raya-kl',
    studioId: 'studio-2',
    layoutId: 'classic',
    layoutName: 'Studio Klasik',
    date: '2025-12-10',
    startTime: '14:00',
    endTime: '17:00',
    duration: 3,
    totalPrice: 450,
    status: 'confirmed',
    notes: 'Penggambaran iklan produk kecantikan',
    createdAt: '2025-11-28T14:00:00Z',
    updatedAt: '2025-11-28T14:00:00Z',
  },
  {
    id: '6',
    reference: 'RAYA-2025-003',
    customerId: 'c6',
    customerName: 'Mohd Faizal',
    customerEmail: 'faizal@example.com',
    customerPhone: '+60115556677',
    companyId: 'raya-kl',
    studioId: 'studio-3',
    layoutId: 'openspace',
    layoutName: 'Studio Moden',
    date: '2025-12-15',
    startTime: '09:00',
    endTime: '12:00',
    duration: 3,
    totalPrice: 600,
    status: 'pending',
    notes: 'Acara fotografi keluarga',
    createdAt: '2025-12-01T09:00:00Z',
    updatedAt: '2025-12-01T09:00:00Z',
  },
  {
    id: '7',
    reference: 'RAYA-2025-004',
    customerId: 'c7',
    customerName: 'Nurul Iman',
    customerEmail: 'nurul@example.com',
    customerPhone: '+60116667788',
    companyId: 'raya-kl',
    studioId: 'studio-1',
    layoutId: 'premium',
    layoutName: 'Studio Minimalist',
    date: '2025-12-20',
    startTime: '13:00',
    endTime: '18:00',
    duration: 5,
    totalPrice: 1400,
    status: 'confirmed',
    notes: 'Sesi penggambaran video muzik',
    createdAt: '2025-12-02T13:00:00Z',
    updatedAt: '2025-12-02T13:00:00Z',
  },
  {
    id: '8',
    reference: 'RAYA-2025-005',
    customerId: 'c8',
    customerName: 'Hafiz Rahman',
    customerEmail: 'hafiz@example.com',
    customerPhone: '+60117778899',
    companyId: 'raya-kl',
    studioId: 'studio-2',
    layoutId: 'classic',
    layoutName: 'Studio Klasik',
    date: '2025-12-25',
    startTime: '10:00',
    endTime: '15:00',
    duration: 5,
    totalPrice: 750,
    status: 'confirmed',
    notes: 'Fotografi produk untuk e-dagang',
    createdAt: '2025-12-03T10:00:00Z',
    updatedAt: '2025-12-03T10:00:00Z',
  },
];

export const generateTimeSlots = (date: Date | undefined, layoutId: string | null): { time: string; available: boolean }[] => {
  const slots = [];
  
  // Check if admin has configured specific time slots for this layout
  const adminConfiguredSlots = layoutId ? configuredTimeSlots[layoutId] : null;
  const hasAdminConfig = adminConfiguredSlots && adminConfiguredSlots.length > 0;
  
  // Mock booked times (in production, this comes from database)
  const bookedTimes = date ? ['10:00', '14:00'] : [];
  
  for (let hour = defaultOperatingHours.start; hour <= defaultOperatingHours.end - 1; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    
    // If admin configured slots, only include those
    if (hasAdminConfig && !adminConfiguredSlots.includes(time)) {
      continue;
    }
    
    slots.push({
      time,
      available: !bookedTimes.includes(time),
    });
  }
  
  return slots;
};
