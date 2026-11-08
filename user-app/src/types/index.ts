export type Role = 'customer' | 'pandit' | 'ops' | 'admin';

export interface SavedAddress {
  _id?: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  pincode: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  addresses?: SavedAddress[];
}

export interface PriceTier { name: string; price: number; description?: string }
export interface ChecklistItem { name: string; quantity: string; providedInKit: boolean }
export interface SamagriKit { _id: string; name: string; price: number }

export interface Puja {
  _id: string;
  name: string;
  category: string;
  description: string;
  significance?: string;
  durationMinutes: number;
  locationTypes: LocationType[];
  samagriChecklist: ChecklistItem[];
  samagriKit?: SamagriKit;
  priceTiers: PriceTier[];
  image?: string;
}

export type LocationType = 'home' | 'temple' | 'online';

export interface Pandit {
  _id: string;
  user?: { name: string; avatar?: string; phone?: string };
  specializations: string[];
  languages: string[];
  experienceYears: number;
  templeAffiliation?: string;
  pujaCharge: number;
  photo?: string;
  rating?: { avg: number; count: number };
}

export interface Slot {
  label: string;
  startTime: string;
  endTime: string;
  notes?: string;
  auspicious: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'pandit_assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
  _id: string;
  bookingNumber: string;
  puja?: { _id: string; name: string; category: string };
  pandit?: Pandit;
  tierName: string;
  date: string;
  timeSlot: { label: string; startTime: string; endTime: string };
  language: string;
  locationType: LocationType;
  address?: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string };
  meetingLink?: string;
  includeSamagri: boolean;
  paymentOption: 'advance' | 'full';
  pricing: { total: number; advanceAmount: number };
  payment: { status: string; amountPaid: number; refundedAmount?: number };
  status: BookingStatus;
  reviewed?: boolean;
  statusHistory: { status: BookingStatus; at: string; note?: string }[];
}

export interface Dispute {
  _id: string;
  booking?: { _id: string; bookingNumber: string; puja?: { name: string } };
  subject: string;
  description: string;
  status: 'open' | 'in_review' | 'resolved' | 'rejected';
  resolution?: string;
  refundAmount?: number;
  createdAt: string;
}

export interface Paginated<T> { data: T; meta: { page: number; pages: number; total: number } | null }
