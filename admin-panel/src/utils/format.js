export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0);

export const fmtDate = (ymd) => {
  if (!ymd) return '';
  return new Date(`${ymd}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');

export const toYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const LOCATION_LABEL = { home: 'At Home', temple: 'At Temple', online: 'Online' };

export const STATUS_META = {
  pending: { label: 'Pending', cls: 'bg-gray-100 text-gray-700' },
  confirmed: { label: 'Confirmed', cls: 'bg-blue-100 text-blue-800' },
  pandit_assigned: { label: 'Pandit Assigned', cls: 'bg-indigo-100 text-indigo-800' },
  in_progress: { label: 'In Progress', cls: 'bg-saffron-100 text-saffron-700' },
  completed: { label: 'Completed', cls: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
  open: { label: 'Open', cls: 'bg-red-100 text-red-700' },
  in_review: { label: 'In Review', cls: 'bg-amber-100 text-amber-800' },
  resolved: { label: 'Resolved', cls: 'bg-green-100 text-green-800' },
};

export const NEXT_STATUS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['cancelled'],
  pandit_assigned: ['confirmed', 'in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
};

