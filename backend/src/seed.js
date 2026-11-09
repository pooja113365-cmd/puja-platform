/* Seeds demo data: staff accounts, pandits, samagri kits, pujas, muhurthams, bookings & reviews.
   Usage: npm run seed   (WARNING: wipes existing data in the target database) */
const mongoose = require('mongoose');
const { env } = require('./config/env');
const connectDB = require('./config/db');
const { disconnectDB } = require('./config/db');
const User = require('./models/User');
const Pandit = require('./models/Pandit');
const Puja = require('./models/Puja');
const Samagri = require('./models/Samagri');
const Muhurtham = require('./models/Muhurtham');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Dispute = require('./models/Dispute');

const PASSWORD = 'Puja@12345';
const ymd = (d) => d.toISOString().slice(0, 10);

async function run({ keepOpen = false } = {}) {
  if (env.isProd && process.env.ALLOW_SEED !== 'true') {
    throw new Error('Refusing to seed in production (set ALLOW_SEED=true to override)');
  }
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
  await Promise.all([User, Pandit, Puja, Samagri, Muhurtham, Booking, Review, Dispute].map((m) => m.deleteMany({})));
  await Pandit.syncIndexes();

  const [, , , customer] = await User.create([
    { name: 'GetPuja Admin', email: 'admin@getpuja.com', phone: '9000000009', password: 'Admin@2026', role: 'admin' },
    { name: 'Platform Admin', email: 'admin@puja.test', phone: '9000000001', password: PASSWORD, role: 'admin' },
    { name: 'Ops Manager', email: 'ops@puja.test', phone: '9000000002', password: PASSWORD, role: 'ops' },
    {
      name: 'Demo Customer',
      email: 'customer@puja.test',
      phone: '9000000003',
      password: PASSWORD,
      role: 'customer',
      addresses: [
        { label: 'Home', line1: '402, Lotus Enclave, Jubilee Hills', line2: 'Road No. 36', city: 'Hyderabad', state: 'Telangana', pincode: '500033' },
        { label: 'Parents Home', line1: '18, Temple Street, Mylapore', city: 'Chennai', state: 'Tamil Nadu', pincode: '600004' },
      ],
    },
  ]);

  const panditSeeds = [
    {
      name: 'Pt. Ramakrishna Sharma',
      email: 'ramakrishna@puja.test',
      phone: '9100000001',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
      specializations: ['Griha Pravesh', 'Satyanarayan', 'Havan', 'Vivah', 'Navagraha'],
      languages: ['Telugu', 'Hindi', 'Sanskrit', 'English'],
      experienceYears: 22,
      templeAffiliation: 'Sri Venkateswara Temple, Hyderabad',
      bio: 'Krishnayajurveda Ghanapathi with 22+ years of experience conducting Griha Pravesh, Satyanarayan Vrat, Navagraha Shanti, and Vedic Vivah ceremonies across Telangana and Andhra Pradesh.',
      pujaCharge: 3100,
      hourlyCharge: 1200,
      serviceCities: ['Hyderabad', 'Secunderabad', 'Warangal'],
      rating: { avg: 4.9, count: 42 },
      completedBookings: 128,
      availability: { weeklyOffDays: [2], unavailableDates: [] },
    },
    {
      name: 'Pt. Subramanian Iyer',
      email: 'subramanian@puja.test',
      phone: '9100000002',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
      specializations: ['Namakaran', 'Shradh', 'Ganapati Puja', 'Navagraha', 'Rudrabhishek'],
      languages: ['Tamil', 'Telugu', 'English', 'Sanskrit'],
      experienceYears: 15,
      templeAffiliation: 'Kapaleeshwarar Temple, Chennai',
      bio: 'Smartha Vedic scholar trained at Kanchipuram Pathashala, specializing in Rudrabhishek, Navagraha Shanti, Namakaran Sanskar, and Pitru Shradh rituals.',
      pujaCharge: 2500,
      hourlyCharge: 1000,
      serviceCities: ['Chennai', 'Bengaluru', 'Coimbatore'],
      rating: { avg: 4.7, count: 27 },
      completedBookings: 84,
      availability: { weeklyOffDays: [], unavailableDates: [] },
    },
    {
      name: 'Pt. Manjunath Bhat',
      email: 'manjunath@puja.test',
      phone: '9100000003',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
      specializations: ['Satyanarayan', 'Lakshmi Puja', 'Rudrabhishek', 'Griha Pravesh'],
      languages: ['Kannada', 'Hindi', 'Sanskrit', 'English'],
      experienceYears: 12,
      templeAffiliation: 'Udupi Sri Krishna Math',
      bio: 'Trained in the Madhva Agamic tradition at Udupi; conducts Ekadasha Rudrabhishek, Satyanarayan Vrat, and Griha Pravesh with authentic Vedic sankalpam.',
      pujaCharge: 2100,
      hourlyCharge: 900,
      serviceCities: ['Bengaluru', 'Mysuru', 'Udupi'],
      rating: { avg: 4.6, count: 18 },
      completedBookings: 56,
      availability: { weeklyOffDays: [1], unavailableDates: [] },
    },
    {
      name: 'Pt. Vishnukant Dubey',
      email: 'vishnu@puja.test',
      phone: '9100000004',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=500&q=80',
      specializations: ['Vivah', 'Havan', 'Shradh', 'Satyanarayan', 'Rudrabhishek', 'Navagraha'],
      languages: ['Hindi', 'English', 'Sanskrit'],
      experienceYears: 30,
      templeAffiliation: 'Kashi Vishwanath Temple, Varanasi',
      bio: 'Third-generation Acharya from Sampurnanand Sanskrit Vishwavidyalaya, Varanasi. Renowned for Maha Rudrabhishek, Vedic Vivah, Navagraha Shanti, and Pitru Tarpan.',
      pujaCharge: 4100,
      hourlyCharge: 1500,
      serviceCities: ['Varanasi', 'Delhi', 'Mumbai', 'Hyderabad'],
      rating: { avg: 4.9, count: 65 },
      completedBookings: 210,
      availability: { weeklyOffDays: [], unavailableDates: [] },
    },
  ];

  const createdPandits = [];
  for (const p of panditSeeds) {
    const user = await User.create({ name: p.name, email: p.email, phone: p.phone, password: PASSWORD, role: 'pandit' });
    const panditDoc = await Pandit.create({
      user: user._id,
      photo: p.photo,
      specializations: p.specializations,
      languages: p.languages,
      experienceYears: p.experienceYears,
      templeAffiliation: p.templeAffiliation,
      bio: p.bio,
      pujaCharge: p.pujaCharge,
      hourlyCharge: p.hourlyCharge,
      serviceCities: p.serviceCities,
      rating: p.rating,
      completedBookings: p.completedBookings,
      availability: p.availability,
      kyc: {
        status: 'approved',
        documents: [
          { type: 'Aadhaar Card', url: 'https://example.com/kyc/aadhaar-verified.pdf' },
          { type: 'Vedic Pathashala Certificate', url: 'https://example.com/kyc/veda-pramana.pdf' },
        ],
        reviewedAt: new Date(),
      },
    });
    createdPandits.push(panditDoc);
  }

  // Pending purohit for Admin KYC Verification Desk
  const pendingUser = await User.create({ name: 'Pt. Gopalakrishna Joshi', email: 'gopal@puja.test', phone: '9100000009', password: PASSWORD, role: 'pandit' });
  await Pandit.create({
    user: pendingUser._id,
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80',
    specializations: ['Havan', 'Ganapati Puja', 'Griha Pravesh'],
    languages: ['Marathi', 'Hindi', 'Sanskrit'],
    experienceYears: 7,
    templeAffiliation: 'Dagdusheth Halwai Ganapati Temple, Pune',
    bio: 'Rigvedi Brahmin from Pune specializing in Ganapati Atharvashirsha Havan and Vastu Shanti.',
    pujaCharge: 1800,
    serviceCities: ['Pune', 'Mumbai'],
    kyc: {
      status: 'pending',
      documents: [
        { type: 'Aadhaar Card', url: 'https://example.com/kyc/gopal-aadhaar.pdf' },
        { type: 'Rigveda Samhita Certificate', url: 'https://example.com/kyc/gopal-veda.pdf' },
      ],
    },
  });

  const [grihaKit, satyaKit, rudraKit, navagrahaKit] = await Samagri.create([
    {
      name: 'Griha Pravesh Complete Samagri Kit',
      description: 'Sacred materials for Dwar Puja, Kalash Sthapana, Vastu Shanti, and Navagraha Havan.',
      price: 1800,
      items: [
        { name: 'Copper / Brass Kalash', quantity: '1' },
        { name: 'Whole Coconuts with husk', quantity: '5' },
        { name: 'Fresh Mango & Ashoka leaves', quantity: '2 bunches' },
        { name: 'Haldi, Kumkum, Chandan, Sindoor & Akshat', quantity: '1 set' },
        { name: 'Navadhanya (9 sacred grains)', quantity: '1 pack' },
        { name: 'Pure Cow Ghee & Havan Samagri', quantity: '1.5 kg' },
        { name: 'Camphor, Dhoop, Cotton Wicks & Moli thread', quantity: '1 pack' },
      ],
    },
    {
      name: 'Satyanarayan Vrat Samagri Kit',
      description: 'Complete puja essentials for Sri Satyanarayan Swamy Vratam and Katha.',
      price: 1200,
      items: [
        { name: 'Chaurang Cloth (Yellow & Red)', quantity: '2 pcs' },
        { name: 'Panchamrit Set (Honey, Ghee, Sugar, Gangajal)', quantity: '1 set' },
        { name: 'Betel Leaves (Paan) & Supari', quantity: '21 pcs' },
        { name: 'Tulsi Dal & Banana Leaves', quantity: '1 bundle' },
        { name: 'Sapta Dhanya & Roli-Moli pack', quantity: '1 set' },
        { name: 'Sooji, Ghee & Dry Fruits for Mahaprasad', quantity: '1 kg' },
      ],
    },
    {
      name: 'Rudrabhishek Dravya & Samagri Kit',
      description: 'Abhishekam dravyas and Shiva archana materials for Laghu / Ekadasha Rudrabhishek.',
      price: 1100,
      items: [
        { name: 'Fresh Bilva Patra (Bel leaves - 3-leafed)', quantity: '108 pcs' },
        { name: 'Vibhuti (Bhasma), Chandan & Rudraksha', quantity: '1 set' },
        { name: 'Gangajal, Rose Water & Sugarcane Juice', quantity: '1 L' },
        { name: 'Honey, Pure Cow Ghee & Black Sesame (Til)', quantity: '500 g' },
        { name: 'Dhatura, White Flowers & Akshat', quantity: '1 basket' },
      ],
    },
    {
      name: 'Navagraha Shanti & Havan Kit',
      description: 'Nine planetary woods (Samidha), Navadhanya, colored cloths, and homam dravyas.',
      price: 1500,
      items: [
        { name: 'Navagraha Samidha (9 sacred twigs: Ark, Palash, Khadir, Apamarga, Pipal, Audumbar, Shami, Durva, Kusha)', quantity: '9 bundles' },
        { name: 'Navadhanya (Wheat, Rice, Toor, Moong, Chana, Val, Sesame, Urad, Kulthi)', quantity: '9 pouches' },
        { name: 'Navagraha Vastra (9 colored cloths)', quantity: '9 pcs' },
        { name: 'Pure Cow Ghee & Havan Samagri', quantity: '1 kg' },
        { name: 'Dry Coconut (Gola) for Purnahuti', quantity: '2 pcs' },
      ],
    },
  ]);

  const createdPujas = await Puja.create([
    {
      name: 'Griha Pravesh Puja',
      slug: 'griha-pravesh-puja',
      category: 'Griha Pravesh',
      image: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=900&q=80',
      isFeatured: true,
      description: 'Auspicious Vedic house-warming ceremony including Dwar Puja, Gau/Kalash Pravesh, Ganapati Puja, Punyahavachanam, Vastu Purusha Mandal Puja, Navagraha Shanti, and Lakshmi Havan.',
      significance: 'Purifies space of Vastu doshas, invokes the directional guardians (Ashta Dikpalakas), and welcomes Goddess Lakshmi for lifelong peace, health, and abundance.',
      durationMinutes: 180,
      locationTypes: ['home'],
      samagriKit: grihaKit._id,
      samagriChecklist: [
        { name: 'Copper Kalash & 5 Coconuts', quantity: '1 set', providedInKit: true },
        { name: 'Mango Leaves, Haldi, Kumkum & Moli', quantity: '1 set', providedInKit: true },
        { name: 'Navadhanya & Havan Samagri with Ghee', quantity: '1.5 kg', providedInKit: true },
        { name: 'Fresh Cow Milk for boiling ceremony', quantity: '1 L', providedInKit: false },
        { name: 'Fresh Marigold Garlands & Loose Flowers', quantity: '2 kg', providedInKit: false },
      ],
      priceTiers: [
        { name: 'Basic', price: 3500, description: '1 Purohit · Dwar Puja, Ganapati Puja, Kalash Sthapana & Milk Boiling' },
        { name: 'Standard', price: 5500, description: '1 Senior Purohit · + Vastu Shanti, Navagraha Puja & Havan' },
        { name: 'Premium', price: 9100, description: '2 Vedic Purohits · + Full Vastu Mandal Homam, Sri Sukta Havan & Satyanarayan Katha' },
      ],
    },
    {
      name: 'Sri Satyanarayan Vrat & Katha',
      slug: 'satyanarayan-vrat',
      category: 'Satyanarayan',
      image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=900&q=80',
      isFeatured: true,
      description: 'Traditional worship of Lord Satyanarayan (Vishnu) with Sankalpam, Kalash & Navagraha Puja, Ashtottara Shatanamavali, five-chapter Skanda Purana Katha, Aarti, and Sapad Bhaksha Prasad.',
      significance: 'Performed on Purnima, Ekadashi, or family milestones to express gratitude, overcome obstacles, and invoke harmony and prosperity.',
      durationMinutes: 120,
      locationTypes: ['home', 'temple', 'online'],
      samagriKit: satyaKit._id,
      samagriChecklist: [
        { name: 'Panchamrit ingredients & Chaurang cloth', quantity: '1 set', providedInKit: true },
        { name: 'Betel leaves (21), Supari & Tulsi Dal', quantity: '1 set', providedInKit: true },
        { name: 'Sapad Prasad ingredients (Sooji, Ghee, Sugar)', quantity: '1 kg', providedInKit: true },
        { name: 'Silver/Framed Idol of Lord Vishnu & Banana Stems', quantity: '1 set', providedInKit: false },
        { name: '5 Varieties of Seasonal Fruits', quantity: '2 kg', providedInKit: false },
      ],
      priceTiers: [
        { name: 'Standard', price: 2100, description: 'Complete Satyanarayan Puja, 5-Adhyaya Katha & Aarti' },
        { name: 'Premium', price: 3800, description: '+ Vishnu Sahasranama Parayanam & Purusha Sukta Havan' },
      ],
    },
    {
      name: 'Vedic Vivah (Wedding) Puja',
      slug: 'vivah-puja',
      category: 'Vivah',
      image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=80',
      isFeatured: true,
      description: 'Authentic Vedic marriage ceremony covering Gauri-Ganesh Puja, Madhuparka, Kanyadaan, Panigrahan, Laja Homa, Agni Pradakshina (Mangal Pheras), Saptapadi (Seven Vows), Mangalsutra Dharana, and Ashirvad.',
      significance: 'Sanctifies the sacred bond of Grihastha Ashrama before Agni Deva with Vedic mantras explained in the family’s language.',
      durationMinutes: 240,
      locationTypes: ['home', 'temple'],
      samagriChecklist: [
        { name: 'Havan Kund, Samidha, Pure Cow Ghee & Laja (Puffed Rice)', quantity: '1 set', providedInKit: false },
        { name: 'Mangalsutra, Toe Rings, Sindoor & Varmala (2 garlands)', quantity: '1 set', providedInKit: false },
        { name: '2 Kalash, Coconuts, Betel Leaves & Saptapadi Supari (7)', quantity: '1 set', providedInKit: false },
        { name: 'Yellow/Silk Antarpat Cloth & Madhuparka Bowl', quantity: '1 set', providedInKit: false },
      ],
      priceTiers: [
        { name: 'Standard', price: 11000, description: '1 Chief Acharya · Complete Vedic Vivah Vidhi with meaning explanation' },
        { name: 'Royal Vedic', price: 21000, description: '3 Vedic Acharyas · Chanting of Mangalashtakam, Laja Homa & Ashirvada Ghanapatha' },
      ],
    },
    {
      name: 'Rudrabhishek Puja (Sri Rudram)',
      slug: 'rudrabhishek-puja',
      category: 'Rudrabhishek',
      image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=900&q=80',
      isFeatured: true,
      description: 'Sacred Abhishekam of Lord Shiva Lingam with Panchamrit, Cow Milk, Curd, Honey, Ghee, Sugarcane Juice, Vibhuti, and Bilva Patra accompanied by Yajurveda Sri Rudram (Namakam & Chamakam).',
      significance: 'Destroys negative karma, cures chronic ailments, pacifies Saturn/Rahu afflictions, and bestows deep inner peace and spiritual upliftment.',
      durationMinutes: 120,
      locationTypes: ['home', 'temple', 'online'],
      samagriKit: rudraKit._id,
      samagriChecklist: [
        { name: '108 Bilva Patra, Vibhuti, Chandan & Rudraksha', quantity: '1 set', providedInKit: true },
        { name: 'Gangajal, Honey, Ghee, Black Til & Sugarcane Juice', quantity: '1 set', providedInKit: true },
        { name: 'Fresh Cow Milk (2 L) & Curd (500 g)', quantity: '2.5 L', providedInKit: false },
        { name: 'Shiva Lingam (Bana/Parad/Clay) & Abhishekam Patra', quantity: '1', providedInKit: false },
      ],
      priceTiers: [
        { name: 'Laghu Rudra (1 Avritti)', price: 2500, description: '1 Purohit · Panchamrit Abhishekam with Sri Rudram Namakam-Chamakam' },
        { name: 'Ekadasha Rudrabhishek', price: 6500, description: '2 Purohits · 11 Recitations of Sri Rudram + Bilva Archana & Rudra Havan' },
      ],
    },
    {
      name: 'Navagraha Shanti Puja & Havan',
      slug: 'navagraha-shanti',
      category: 'Navagraha',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80',
      isFeatured: true,
      description: 'Vedic propitiation of the Nine Planetary Deities (Surya, Chandra, Mangala, Budha, Brihaspati, Shukra, Shani, Rahu, Ketu) with Kalash Sthapana, Graha Mantra Japa, Navadhanya Daan, and 9-Samidha Havan.',
      significance: 'Neutralizes malefic planetary transits (Sade Sati, Manglik, Kaal Sarp, Rahu-Ketu Dasha) and restores career, health, and family stability.',
      durationMinutes: 150,
      locationTypes: ['home', 'temple', 'online'],
      samagriKit: navagrahaKit._id,
      samagriChecklist: [
        { name: '9 Sacred Samidha Bundles (Ark, Palash, Khadir, etc.)', quantity: '9 bundles', providedInKit: true },
        { name: 'Navadhanya (9 grains) & 9 Colored Vastras', quantity: '1 set', providedInKit: true },
        { name: 'Pure Cow Ghee, Havan Samagri & Purnahuti Gola', quantity: '1 kg', providedInKit: true },
        { name: 'Fresh Flowers, Fruits & Prasad Sweets', quantity: '1 kg', providedInKit: false },
      ],
      priceTiers: [
        { name: 'Standard', price: 2900, description: '1 Purohit · Navagraha Mandala Puja & 108 Ahuti Havan' },
        { name: 'Maha Shanti', price: 5400, description: '2 Purohits · Dashamsha Graha Japa, Navagraha Homam & Graha Daan' },
      ],
    },
    {
      name: 'Shradh & Pitru Tarpan (Death Rites)',
      slug: 'shradh-pitru-tarpan',
      category: 'Shradh',
      image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=80',
      isFeatured: false,
      description: 'Solemn Vedic ancestral rites including Sankalpam, Vishwadeva Puja,Til-Tarpana, Pinda Pradanam (Rice/Barley balls), Pitru Aradhana, and Vasordhara guidance for Varshika Abdikam or Pitru Paksha.',
      significance: 'Fulfills Pitru Rina (ancestral debt), relieves Pitru Dosha, grants liberation (Moksha) to departed ancestors, and invokes their blessings upon descendants.',
      durationMinutes: 120,
      locationTypes: ['home', 'temple', 'online'],
      samagriChecklist: [
        { name: 'Kusha Grass (Darbha) & Pavitram rings', quantity: '2 bunches', providedInKit: false },
        { name: 'Black Sesame Seeds (Kala Til) & Barley (Jau)', quantity: '250 g', providedInKit: false },
        { name: 'Cooked Rice, Cow Ghee, Honey & Black Urad for Pinda', quantity: '500 g', providedInKit: false },
        { name: 'White Cloth, White Flowers & Tulsi Leaves', quantity: '1 set', providedInKit: false },
      ],
      priceTiers: [
        { name: 'Til Tarpan & Pinda Daan', price: 2800, description: '1 Smartha Acharya · Complete Shradh Tarpan & Pinda Pradanam' },
        { name: 'Varshika Abdikam / नारायण बलि', price: 5100, description: '2 Acharyas · Full Abdika Shradh Vidhi, Homa & Brahmin Bhojan Sankalpam' },
      ],
    },
  ]);

  // Seed auspicious Muhurtham windows for the next 10 days
  const muhurthamDocs = [];
  for (let offset = 1; offset <= 10; offset += 1) {
    const d = new Date(Date.now() + offset * 24 * 3600 * 1000);
    const dateStr = ymd(d);
    muhurthamDocs.push(
      {
        date: dateStr,
        label: 'Amrit Siddhi Muhurtham',
        startTime: '07:30',
        endTime: '09:30',
        notes: 'Rohini / Pushya Nakshatra — auspicious for Griha Pravesh & Satyanarayan Vrat',
      },
      {
        date: dateStr,
        label: 'Abhijit Shubh Muhurtham',
        startTime: '11:45',
        endTime: '13:15',
        notes: 'Midday विजय मुहूर्त — ideal for Rudrabhishek, Navagraha Shanti & Vivah Sankalpam',
      }
    );
  }
  await Muhurtham.create(muhurthamDocs);

  // Seed a completed booking + review and an upcoming confirmed booking for the demo customer
  const pastDate = ymd(new Date(Date.now() - 7 * 24 * 3600 * 1000));
  const futureDate = ymd(new Date(Date.now() + 3 * 24 * 3600 * 1000));
  const completedBooking = await Booking.create({
    bookingNumber: 'PJSEED001',
    customer: customer._id,
    puja: createdPujas[1]._id,
    pandit: createdPandits[0]._id,
    tierName: 'Standard',
    date: pastDate,
    timeSlot: { label: 'Amrit Siddhi Muhurtham', startTime: '07:30', endTime: '09:30' },
    language: 'Telugu',
    locationType: 'home',
    address: customer.addresses[0],
    includeSamagri: true,
    samagriKit: satyaKit._id,
    paymentOption: 'full',
    pricing: {
      tierPrice: 2100,
      samagriPrice: 1200,
      total: 3300,
      advanceAmount: 3300,
      commissionRate: 0.2,
      commissionAmount: 660,
      panditEarning: 2640,
    },
    payment: {
      status: 'paid',
      amountPaid: 3300,
      pendingAmount: 0,
      razorpayOrderId: 'order_seed_001',
      razorpayPaymentIds: ['pay_seed_001'],
      paidAt: new Date(Date.now() - 8 * 24 * 3600 * 1000),
    },
    status: 'completed',
    reviewed: true,
    payout: { status: 'pending' },
    statusHistory: [
      { status: 'pending', by: customer._id, note: 'Booking created' },
      { status: 'confirmed', by: customer._id, note: 'Payment received' },
      { status: 'pandit_assigned', by: customer._id, note: 'Auto-matched purohit' },
      { status: 'in_progress', note: 'Puja started' },
      { status: 'completed', note: 'Puja completed' },
    ],
  });

  await Review.create({
    booking: completedBooking._id,
    customer: customer._id,
    pandit: createdPandits[0]._id,
    puja: createdPujas[1]._id,
    rating: 5,
    comment: 'Pt. Ramakrishna Sharma explained every chapter of Satyanarayan Katha in Telugu with deep devotion. Punctual and very peaceful experience!',
  });

  await Booking.create({
    bookingNumber: 'PJSEED002',
    customer: customer._id,
    puja: createdPujas[0]._id,
    pandit: createdPandits[0]._id,
    tierName: 'Standard',
    date: futureDate,
    timeSlot: { label: 'Amrit Siddhi Muhurtham', startTime: '07:30', endTime: '09:30' },
    language: 'Telugu',
    locationType: 'home',
    address: customer.addresses[0],
    includeSamagri: true,
    samagriKit: grihaKit._id,
    paymentOption: 'advance',
    pricing: {
      tierPrice: 5500,
      samagriPrice: 1800,
      total: 7300,
      advanceAmount: 2190,
      commissionRate: 0.2,
      commissionAmount: 1460,
      panditEarning: 5840,
    },
    payment: {
      status: 'partial',
      amountPaid: 2190,
      pendingAmount: 0,
      razorpayOrderId: 'order_seed_002',
      razorpayPaymentIds: ['pay_seed_002'],
      paidAt: new Date(),
    },
    status: 'pandit_assigned',
    statusHistory: [
      { status: 'pending', by: customer._id, note: 'Booking created' },
      { status: 'confirmed', by: customer._id, note: 'Payment received' },
      { status: 'pandit_assigned', by: customer._id, note: 'Purohit selected by customer' },
    ],
  });

  console.log('Seed complete. Logins (password: %s): admin@puja.test, ops@puja.test, customer@puja.test, ramakrishna@puja.test', PASSWORD);
  if (!keepOpen) {
    await disconnectDB();
  }
}

if (require.main === module) {
  run().catch(async (e) => {
    console.error(e);
    await disconnectDB();
    process.exit(1);
  });
}

module.exports = { run };
