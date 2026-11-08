export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0);

export const fmtDate = (ymd) => {
  if (!ymd) return '';
  const d = new Date(`${ymd}T00:00:00`);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export const toYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const duration = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h} hr` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
};

export const LOCATION_LABEL = { home: 'At Home', temple: 'At Temple', online: 'Online e-Puja' };

export const STATUS_META = {
  pending: { label: 'Pending', cls: 'bg-gray-100 text-gray-700' },
  confirmed: { label: 'Confirmed', cls: 'bg-blue-100 text-blue-800' },
  pandit_assigned: { label: 'Pandit Assigned', cls: 'bg-indigo-100 text-indigo-800' },
  in_progress: { label: 'In Progress', cls: 'bg-saffron-100 text-saffron-700' },
  completed: { label: 'Completed', cls: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
};

export const STATUS_FLOW = ['pending', 'confirmed', 'pandit_assigned', 'in_progress', 'completed'];

