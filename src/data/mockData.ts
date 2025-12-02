import { StudioLayout, Booking, Company } from '@/types/booking';

export const mockLayouts: StudioLayout[] = [
  {
    id: 'classic',
    name: 'Classic Studio',
    description: 'A timeless setup with professional lighting and backdrop options. Perfect for portraits and product photography.',
    capacity: 6,
    pricePerHour: 150,
    amenities: ['Professional lighting', 'Multiple backdrops', 'Props included', 'Changing room'],
  },
  {
    id: 'premium',
    name: 'Premium Suite',
    description: 'Our flagship studio with advanced equipment and spacious environment. Ideal for commercial shoots and video production.',
    capacity: 12,
    pricePerHour: 280,
    amenities: ['4K video equipment', 'Green screen', 'Sound dampening', 'Client lounge', 'Makeup station'],
  },
  {
    id: 'openspace',
    name: 'Open Space',
    description: 'A versatile, naturally-lit creative space. Great for lifestyle shoots, yoga sessions, and small events.',
    capacity: 20,
    pricePerHour: 200,
    amenities: ['Natural lighting', 'Modular furniture', 'Sound system', 'Kitchenette access'],
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
    layoutName: 'Premium Suite',
    date: '2024-12-05',
    startTime: '10:00',
    endTime: '14:00',
    duration: 4,
    totalPrice: 1120,
    status: 'confirmed',
    notes: 'Corporate headshots for 8 team members',
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
    layoutName: 'Classic Studio',
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
    layoutName: 'Open Space',
    date: '2024-12-07',
    startTime: '09:00',
    endTime: '12:00',
    duration: 3,
    totalPrice: 600,
    status: 'confirmed',
    notes: 'Yoga photoshoot for wellness brand',
    createdAt: '2024-12-03T09:00:00Z',
    updatedAt: '2024-12-03T09:00:00Z',
  },
];

export const generateTimeSlots = (date: Date, layoutId: string): { time: string; available: boolean }[] => {
  const slots = [];
  const bookedTimes = ['10:00', '11:00', '14:00', '15:00'];
  
  for (let hour = 9; hour <= 20; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    slots.push({
      time,
      available: !bookedTimes.includes(time) || Math.random() > 0.3,
    });
  }
  
  return slots;
};
