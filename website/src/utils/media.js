// Curated authentic spiritual photography & Vedic priest portraits for VedaPujas Hyderabad launch

export const HYDERABAD_ZONES = [
  '📍 Hyderabad — Gachibowli & Madhapur',
  '📍 Hyderabad — Kukatpally & Miyapur',
  '📍 Hyderabad — Jubilee Hills & Banjara Hills',
  '📍 Hyderabad — Kondapur & Hitech City',
  '📍 Secunderabad & Kompally',
  '🌐 Online e-Puja (Video Sankalpam)',
];

export const PUJA_IMAGES = {
  'griha-pravesh-puja': '/images/griha-pravesh.jpg',
  'satyanarayan-vrat': '/images/satyanarayan.jpg',
  'vivah-puja': '/images/vivah.jpg',
  'rudrabhishek-puja': '/images/rudrabhishek.jpg',
  'navagraha-shanti': '/images/navagraha.jpg',
  'shradh-pitru-tarpan': '/images/shradh.jpg',
};

export const CATEGORY_IMAGES = {
  'Griha Pravesh': PUJA_IMAGES['griha-pravesh-puja'],
  Satyanarayan: PUJA_IMAGES['satyanarayan-vrat'],
  Vivah: PUJA_IMAGES['vivah-puja'],
  Rudrabhishek: PUJA_IMAGES['rudrabhishek-puja'],
  Navagraha: PUJA_IMAGES['navagraha-shanti'],
  Shradh: PUJA_IMAGES['shradh-pitru-tarpan'],
  Havan: PUJA_IMAGES['navagraha-shanti'],
  Namakaran: PUJA_IMAGES['satyanarayan-vrat'],
  'Ganapati Puja': PUJA_IMAGES['griha-pravesh-puja'],
  'Lakshmi Puja': PUJA_IMAGES['griha-pravesh-puja'],
};

export function getPujaImage(puja) {
  if (!puja) return CATEGORY_IMAGES['Griha Pravesh'];
  if (puja.slug && PUJA_IMAGES[puja.slug]) return PUJA_IMAGES[puja.slug];
  if (puja.category && CATEGORY_IMAGES[puja.category]) return CATEGORY_IMAGES[puja.category];
  if (puja.image) return puja.image;
  return CATEGORY_IMAGES['Griha Pravesh'];
}

export const PANDIT_PORTRAITS = [
  '/images/pandit-1.jpg',
  '/images/pandit-2.jpg',
  '/images/pandit-3.jpg',
  '/images/pandit-4.jpg',
  '/images/pandit-5.jpg',
];

export const PANDIT_PORTRAIT_BY_NAME = {
  'Pt. Ramakrishna Sharma': '/images/pandit-1.jpg',
  'Pt. Subramanian Iyer': '/images/pandit-2.jpg',
  'Pt. Manjunath Bhat': '/images/pandit-3.jpg',
  'Pt. Vishnukant Dubey': '/images/pandit-4.jpg',
  'Pt. Gopalakrishna Joshi': '/images/pandit-5.jpg',
};

export function getPanditPhoto(pandit) {
  if (!pandit) return PANDIT_PORTRAITS[0];
  const name = pandit.user?.name || '';
  if (PANDIT_PORTRAIT_BY_NAME[name]) return PANDIT_PORTRAIT_BY_NAME[name];
  if (pandit.photo && pandit.photo.startsWith('/images/')) return pandit.photo;
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return PANDIT_PORTRAITS[hash % PANDIT_PORTRAITS.length];
}
