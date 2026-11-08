const ROLES = { CUSTOMER: 'customer', PANDIT: 'pandit', OPS: 'ops', ADMIN: 'admin' };

const SPECIALIZATIONS = [
  'Griha Pravesh', 'Satyanarayan', 'Vivah', 'Havan', 'Namakaran', 'Shradh',
  'Ganapati Puja', 'Lakshmi Puja', 'Rudrabhishek', 'Navagraha', 'Other',
];

const LANGUAGES = [
  'Telugu', 'Tamil', 'Kannada', 'Hindi', 'Malayalam', 'Marathi',
  'Bengali', 'Gujarati', 'Sanskrit', 'English',
];

const LOCATION_TYPES = ['home', 'temple', 'online'];

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PANDIT_ASSIGNED: 'pandit_assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'pandit_assigned', 'in_progress', 'completed'];

// Standard auspicious windows offered every day. Admin-defined muhurthams are added on top.
const DEFAULT_SLOTS = [
  { label: 'Brahma Muhurta', startTime: '04:30', endTime: '06:30' },
  { label: 'Morning', startTime: '07:00', endTime: '09:00' },
  { label: 'Late Morning', startTime: '09:30', endTime: '11:30' },
  { label: 'Abhijit Muhurta', startTime: '11:30', endTime: '13:00' },
  { label: 'Afternoon', startTime: '15:00', endTime: '17:00' },
  { label: 'Pradosh Kaal', startTime: '18:00', endTime: '20:00' },
];

module.exports = {
  ROLES, SPECIALIZATIONS, LANGUAGES, LOCATION_TYPES,
  BOOKING_STATUS, ACTIVE_BOOKING_STATUSES, DEFAULT_SLOTS,
};

