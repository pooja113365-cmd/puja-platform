import type { BookingStatus, LocationType, Pandit, Puja } from '../types';

export const COLORS = { saffron: '#F27F0C', maroon: '#6B1D1D', gold: '#D4A017', cream: '#FFF8E7', white: '#FFFFFF' };

const ASSET_HOST = 'http://localhost:5173';

export function getPujaImageUrl(puja?: Partial<Puja> | null): string {
  if (puja?.image && /^https?:\/\//i.test(puja.image)) return puja.image;
  const key = `${puja?.name || ''} ${puja?.category || ''}`.toLowerCase();
  if (key.includes('griha')) return `${ASSET_HOST}/images/griha-pravesh.jpg`;
  if (key.includes('satyanarayan')) return `${ASSET_HOST}/images/satyanarayan.jpg`;
  if (key.includes('rudra')) return `${ASSET_HOST}/images/rudrabhishek.jpg`;
  if (key.includes('navagraha')) return `${ASSET_HOST}/images/navagraha.jpg`;
  if (key.includes('vivah')) return `${ASSET_HOST}/images/vivah.jpg`;
  if (key.includes('shradh') || key.includes('pitru')) return `${ASSET_HOST}/images/shradh.jpg`;
  return `${ASSET_HOST}/images/griha-pravesh.jpg`;
}

const PANDIT_PHOTOS = [
  `${ASSET_HOST}/images/pandit-1.jpg`,
  `${ASSET_HOST}/images/pandit-2.jpg`,
  `${ASSET_HOST}/images/pandit-3.jpg`,
  `${ASSET_HOST}/images/pandit-4.jpg`,
  `${ASSET_HOST}/images/pandit-5.jpg`,
];

export function getPanditPhotoUrl(pandit?: Partial<Pandit> | null, index = 0): string {
  if (pandit?.photo && /^https?:\/\//i.test(pandit.photo)) return pandit.photo;
  if (pandit?.user?.avatar && /^https?:\/\//i.test(pandit.user.avatar)) return pandit.user.avatar;
  const seed = pandit?._id || pandit?.user?.name || String(index);
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return PANDIT_PHOTOS[Math.abs(hash) % PANDIT_PHOTOS.length];
}

export const inr = (n?: number) =>
  `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

export const fmtDate = (ymd: string) => {
  const d = new Date(`${ymd}T00:00:00`);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const duration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h} hr` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
};

export const LOCATION_LABEL: Record<LocationType, string> = { home: 'At Home', temple: 'At Temple', online: 'Online e-Puja' };

export const STATUS_META: Record<BookingStatus, { label: string; bg: string; fg: string }> = {
  pending: { label: 'Pending', bg: 'bg-gray-100', fg: 'text-gray-700' },
  confirmed: { label: 'Confirmed', bg: 'bg-blue-100', fg: 'text-blue-800' },
  pandit_assigned: { label: 'Pandit Assigned', bg: 'bg-indigo-100', fg: 'text-indigo-800' },
  in_progress: { label: 'In Progress', bg: 'bg-saffron-100', fg: 'text-saffron-700' },
  completed: { label: 'Completed', bg: 'bg-green-100', fg: 'text-green-800' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', fg: 'text-red-700' },
};

export const STATUS_FLOW: BookingStatus[] = ['pending', 'confirmed', 'pandit_assigned', 'in_progress', 'completed'];

