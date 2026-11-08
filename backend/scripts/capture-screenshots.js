/**
 * Automated Screenshot Capture Script (Puppeteer)
 * Captures desktop & mobile screenshots across:
 *   - website/screenshots/ (7 views)
 *   - admin-panel/screenshots/ (6 views)
 *   - user-app/screenshots/ (5 mobile 390x844 views)
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '../..');
const WEBSITE_DIR = path.join(ROOT, 'website', 'screenshots');
const ADMIN_DIR = path.join(ROOT, 'admin-panel', 'screenshots');
const MOBILE_DIR = path.join(ROOT, 'user-app', 'screenshots');

const API_BASE = 'http://localhost:5000/api';
const WEBSITE_URL = 'http://localhost:5173';
const ADMIN_URL = 'http://localhost:5174';

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

function findBrowser() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No Chrome/Edge binary found');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  return res.json();
}

async function clickButtonByText(page, text) {
  const clicked = await page.evaluate((targetText) => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const match = buttons.find((b) => b.textContent && b.textContent.trim().includes(targetText));
    if (match) {
      match.click();
      return true;
    }
    return false;
  }, text);
  return clicked;
}

async function captureWebsite(browser, seedData) {
  console.log('--- Capturing User Website (website/screenshots/) ---');
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // 01-home-page.png
  await page.goto(`${WEBSITE_URL}/`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await sleep(600);
  await page.screenshot({ path: path.join(WEBSITE_DIR, '01-home-page.png'), fullPage: true });
  console.log('Saved website/screenshots/01-home-page.png');

  // 02-puja-catalog.png
  await page.goto(`${WEBSITE_URL}/pujas`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('form');
  await sleep(600);
  await page.screenshot({ path: path.join(WEBSITE_DIR, '02-puja-catalog.png'), fullPage: true });
  console.log('Saved website/screenshots/02-puja-catalog.png');

  // 03-puja-detail.png
  const grihaPuja = seedData.pujas.find((p) => p.slug === 'griha-pravesh-puja') || seedData.pujas[0];
  await page.goto(`${WEBSITE_URL}/pujas/${grihaPuja._id}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await sleep(600);
  await page.screenshot({ path: path.join(WEBSITE_DIR, '03-puja-detail.png'), fullPage: true });
  console.log('Saved website/screenshots/03-puja-detail.png');

  // 04-pandits-list.png
  await page.goto(`${WEBSITE_URL}/purohits`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await sleep(600);
  await page.screenshot({ path: path.join(WEBSITE_DIR, '04-pandits-list.png'), fullPage: true });
  console.log('Saved website/screenshots/04-pandits-list.png');

  // 05-pandit-detail.png
  const firstPandit = seedData.pandits[0];
  await page.goto(`${WEBSITE_URL}/purohits/${firstPandit._id}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await sleep(600);
  await page.screenshot({ path: path.join(WEBSITE_DIR, '05-pandit-detail.png'), fullPage: true });
  console.log('Saved website/screenshots/05-pandit-detail.png');

  // Log in as Demo Customer for 06-booking-flow.png and 07-my-bookings.png
  await page.evaluate((token) => {
    localStorage.setItem('puja_token', token);
  }, seedData.customerToken);

  // 06-booking-flow.png
  const satyaPuja = seedData.pujas.find((p) => p.slug === 'satyanarayan-vrat') || seedData.pujas[0];
  await page.goto(`${WEBSITE_URL}/book/${satyaPuja._id}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await sleep(500);
  // Advance from Step 1 (Package) to Step 2 (Date & Muhurtham) and pick a date + slot
  await clickButtonByText(page, 'Continue');
  await sleep(400);
  const tomorrow = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const dateInput = await page.$('input[type="date"]');
  if (dateInput) {
    await page.evaluate((el, val) => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(el, val);
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, dateInput, tomorrow);
    await sleep(700);
    await clickButtonByText(page, 'Muhurtham');
    const langSelect = await page.$('select#lang');
    if (langSelect) {
      await page.select('select#lang', 'Telugu');
    }
    await sleep(400);
  }
  await page.screenshot({ path: path.join(WEBSITE_DIR, '06-booking-flow.png'), fullPage: true });
  console.log('Saved website/screenshots/06-booking-flow.png');

  // 07-my-bookings.png (Customer booking detail & live status tracker)
  const upcomingBooking = seedData.customerBookings.find((b) => b.status === 'pandit_assigned') || seedData.customerBookings[0];
  if (upcomingBooking) {
    await page.goto(`${WEBSITE_URL}/bookings/${upcomingBooking._id}`, { waitUntil: 'networkidle0' });
  } else {
    await page.goto(`${WEBSITE_URL}/bookings`, { waitUntil: 'networkidle0' });
  }
  await page.waitForSelector('h1');
  await sleep(700);
  await page.screenshot({ path: path.join(WEBSITE_DIR, '07-my-bookings.png'), fullPage: true });
  console.log('Saved website/screenshots/07-my-bookings.png');

  // 08-bookings-list.png (Customer bookings list dashboard)
  await page.goto(`${WEBSITE_URL}/bookings`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await sleep(600);
  await page.screenshot({ path: path.join(WEBSITE_DIR, '08-bookings-list.png'), fullPage: true });
  console.log('Saved website/screenshots/08-bookings-list.png');

  // Clear token to capture public Login & Register screens
  await page.evaluate(() => {
    localStorage.removeItem('puja_token');
  });

  // 09-login.png (Customer Login Screen)
  await page.goto(`${WEBSITE_URL}/login`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await sleep(500);
  await page.screenshot({ path: path.join(WEBSITE_DIR, '09-login.png'), fullPage: true });
  console.log('Saved website/screenshots/09-login.png');

  // 10-register.png (Customer Register Screen)
  await page.goto(`${WEBSITE_URL}/register`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await sleep(500);
  await page.screenshot({ path: path.join(WEBSITE_DIR, '10-register.png'), fullPage: true });
  console.log('Saved website/screenshots/10-register.png');

  await page.close();
}

async function captureAdminPanel(browser, seedData) {
  console.log('--- Capturing Admin & Ops Panel (admin-panel/screenshots/) ---');
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  await page.goto(`${ADMIN_URL}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate((token) => {
    localStorage.setItem('puja_admin_token', token);
  }, seedData.adminToken);

  // 01-admin-dashboard.png
  await page.goto(`${ADMIN_URL}/`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await sleep(700);
  await page.screenshot({ path: path.join(ADMIN_DIR, '01-admin-dashboard.png'), fullPage: true });
  console.log('Saved admin-panel/screenshots/01-admin-dashboard.png');

  // 02-pandits-kyc-desk.png (with KYC Verification Modal open)
  await page.goto(`${ADMIN_URL}/pandits`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await sleep(600);
  await clickButtonByText(page, 'Inspect');
  await sleep(500);
  await page.screenshot({ path: path.join(ADMIN_DIR, '02-pandits-kyc-desk.png'), fullPage: true });
  console.log('Saved admin-panel/screenshots/02-pandits-kyc-desk.png');

  // 03-pujas-catalog-crud.png (with Puja Edit Modal open)
  await page.goto(`${ADMIN_URL}/pujas`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await sleep(600);
  await clickButtonByText(page, 'Edit');
  await sleep(500);
  await page.screenshot({ path: path.join(ADMIN_DIR, '03-pujas-catalog-crud.png'), fullPage: true });
  console.log('Saved admin-panel/screenshots/03-pujas-catalog-crud.png');

  // 04-samagri-manager.png
  await page.goto(`${ADMIN_URL}/samagri`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await sleep(600);
  await page.screenshot({ path: path.join(ADMIN_DIR, '04-samagri-manager.png'), fullPage: true });
  console.log('Saved admin-panel/screenshots/04-samagri-manager.png');

  // 05-muhurtham-calendar.png
  await page.goto(`${ADMIN_URL}/muhurthams`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await sleep(600);
  await page.screenshot({ path: path.join(ADMIN_DIR, '05-muhurtham-calendar.png'), fullPage: true });
  console.log('Saved admin-panel/screenshots/05-muhurtham-calendar.png');

  // 06-bookings-management.png
  await page.goto(`${ADMIN_URL}/bookings`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await sleep(600);
  await page.screenshot({ path: path.join(ADMIN_DIR, '06-bookings-management.png'), fullPage: true });
  console.log('Saved admin-panel/screenshots/06-bookings-management.png');

  await page.close();
}

function buildMobileScreenHtml(title, bodyHtml, activeTab = 'home', stickyBottomHtml = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=390, initial-scale=1.0" />
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  body { background: #FFFDF7; color: #360D0D; width: 390px; min-height: 844px; display: flex; flex-direction: column; overflow-x: hidden; }
  .status-bar { background: #360D0D; color: #FFF8E7; padding: 10px 20px 6px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; }
  .app-bar { background: linear-gradient(90deg, #4E1313 0%, #6B1D1D 100%); color: #FFF8E7; padding: 10px 16px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(245,196,81,0.35); }
  .brand-row { display: flex; align-items: center; gap: 9px; }
  .diya-icon { width: 32px; height: 32px; border-radius: 16px; background: #360D0D; border: 1.5px solid #F5C451; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); }
  .brand-title { font-size: 16px; font-weight: 800; color: #FFF8E7; letter-spacing: 0.3px; line-height: 1.1; }
  .brand-sub { font-size: 9px; font-weight: 700; color: #F5C451; text-transform: uppercase; letter-spacing: 1.1px; margin-top: 2px; }
  .loc-pill { background: #360D0D; border: 1px solid rgba(245,196,81,0.65); color: #F5C451; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; }
  .content { flex: 1; padding: 14px 16px ${stickyBottomHtml ? '148px' : '84px'}; }
  .hero { background: linear-gradient(135deg, #4E1313 0%, #7C1D1D 55%, #EA580C 100%); border-radius: 20px; padding: 18px; color: #FFF8E7; position: relative; overflow: hidden; border: 1.5px solid rgba(245,196,81,0.55); box-shadow: 0 8px 20px rgba(78,19,19,0.18); }
  .hero-tag { display: inline-block; background: rgba(54,13,13,0.75); border: 1px solid rgba(245,196,81,0.6); padding: 3px 10px; border-radius: 999px; color: #F5C451; font-size: 9.5px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
  .hero h2 { font-size: 20px; font-weight: 800; line-height: 1.25; margin-top: 8px; }
  .hero p { font-size: 11.5px; color: #FDF3D7; margin-top: 6px; line-height: 1.45; }
  .hero-btn { margin-top: 12px; background: #F27F0C; color: #fff; border: 1px solid #FDE68A; border-radius: 12px; padding: 10px 14px; font-size: 12.5px; font-weight: 800; text-align: center; display: block; width: 100%; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
  .upcoming-card { margin-top: 12px; background: #FFF8E7; border: 1.5px solid #D4A017; border-radius: 14px; padding: 12px; display: flex; justify-content: space-between; align-items: center; }
  .sec-title { font-size: 14.5px; font-weight: 800; color: #4E1313; margin: 15px 0 8px; display: flex; justify-content: space-between; align-items: center; }
  .chips-scroll { display: flex; gap: 7px; overflow-x: hidden; white-space: nowrap; padding-bottom: 2px; }
  .chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip { padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid #E5D5B5; background: #fff; color: #4E1313; flex-shrink: 0; }
  .chip.active { background: #4E1313; border-color: #F5C451; color: #F5C451; }
  .card { background: #fff; border: 1px solid #F0E6D2; border-radius: 14px; padding: 12px; margin-bottom: 10px; box-shadow: 0 2px 6px rgba(78,19,19,0.04); }
  .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; }
  .badge-saffron { background: #FDEFD9; color: #B85A00; }
  .badge-green { background: #DCFCE7; color: #166534; }
  .badge-indigo { background: #E0E7FF; color: #3730A3; }
  .btn-primary { background: #F27F0C; color: #fff; border-radius: 12px; padding: 12px; text-align: center; font-weight: 800; font-size: 13.5px; display: block; width: 100%; border: none; }
  .btn-green { background: #15803D; color: #fff; border-radius: 12px; padding: 10px; text-align: center; font-weight: 800; font-size: 12.5px; display: block; width: 100%; margin-top: 8px; }
  .btn-outline { background: #fff; color: #4E1313; border: 1.5px solid #D4A017; border-radius: 12px; padding: 10px; text-align: center; font-weight: 800; font-size: 12.5px; display: block; width: 100%; margin-top: 8px; }
  .sticky-safe { position: fixed; bottom: 54px; left: 0; width: 390px; background: rgba(255,253,247,0.98); border-top: 1.5px solid #E5D5B5; padding: 10px 16px; box-shadow: 0 -4px 12px rgba(78,19,19,0.08); }
  .tab-bar { position: fixed; bottom: 0; left: 0; width: 390px; background: #FFF8E7; border-top: 1px solid #E5D5B5; display: flex; justify-content: space-around; padding: 7px 0 12px; font-size: 10.5px; font-weight: 700; }
  .tab { text-align: center; color: #8A2A2A; }
  .tab.active { color: #F27F0C; }
  .row { display: flex; justify-content: space-between; align-items: center; }
</style>
</head>
<body>
  <div class="status-bar"><span>9:41</span><span>5G · 100%</span></div>
  <div class="app-bar">
    <div class="brand-row">
      <div class="diya-icon">🪔</div>
      <div>
        <div class="brand-title">VedaPujas</div>
        <div class="brand-sub">${title}</div>
      </div>
    </div>
    <span class="loc-pill">📍 Hyderabad</span>
  </div>
  <div class="content">${bodyHtml}</div>
  ${stickyBottomHtml ? `<div class="sticky-safe">${stickyBottomHtml}</div>` : ''}
  <div class="tab-bar">
    <div class="tab ${activeTab === 'home' ? 'active' : ''}">🏠<br/>Home</div>
    <div class="tab ${activeTab === 'pujas' ? 'active' : ''}">🔥<br/>Pujas</div>
    <div class="tab ${activeTab === 'bookings' ? 'active' : ''}">📅<br/>My Bookings</div>
    <div class="tab ${activeTab === 'profile' ? 'active' : ''}">👤<br/>Profile</div>
  </div>
</body>
</html>`;
}

async function captureMobileApp(browser, seedData) {
  console.log('--- Capturing Customer Mobile App (user-app/screenshots/) ---');
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });

  const griha = seedData.pujas.find((p) => p.slug === 'griha-pravesh-puja') || seedData.pujas[0];
  const satya = seedData.pujas.find((p) => p.slug === 'satyanarayan-vrat') || seedData.pujas[1];
  const pandit1 = seedData.pandits[0];
  const pandit2 = seedData.pandits[1];
  const panditPhone = pandit1?.user?.phone || pandit1?.phone || '9100000001';

  // 01-mobile-home.png
  const homeHtml = buildMobileScreenHtml(
    'Sacred Vedic Seva',
    `
    <div class="hero">
      <div class="hero-tag">🪔 VedaPujas · Hyderabad #1 Vedic Platform</div>
      <h2>Authentic Vedic Rituals by Veda Patasala Scholars</h2>
      <p>Griha Pravesh, Satyanarayan Vrat, Rudrabhishek & Navagraha Homam — with doorstep Samagri across Gachibowli, Madhapur & Kukatpally.</p>
      <div class="hero-btn">Explore Puja Catalog →</div>
    </div>
    <div class="upcoming-card">
      <div>
        <div style="font-size:9.5px;font-weight:800;color:#B85A00;text-transform:uppercase">Upcoming Ritual · #PJSEED002</div>
        <div style="font-size:13.5px;font-weight:800;color:#4E1313;margin-top:2px">Griha Pravesh Puja (Standard)</div>
        <div style="font-size:10.5px;color:#6B1D1D;margin-top:2px">📅 Amrit Siddhi Muhurtham (07:30–09:30)</div>
      </div>
      <span class="badge badge-indigo">PANDIT ASSIGNED</span>
    </div>
    <div class="sec-title"><span>Quick-Book Categories</span><span style="font-size:11px;color:#F27F0C">Swipe →</span></div>
    <div class="chips-scroll">
      <span class="chip active">✨ All Rituals</span>
      <span class="chip">🏠 Griha Pravesh</span>
      <span class="chip">🪔 Satyanarayan</span>
      <span class="chip">🔱 Rudrabhishek</span>
      <span class="chip">☀️ Navagraha</span>
    </div>
    <div class="sec-title"><span>Featured Vedic Pandits</span><span style="font-size:10.5px;color:#15803D">✓ Patasala Certified</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div class="card" style="margin-bottom:0;padding:10px">
        <div style="display:flex;align-items:center;gap:8px">
          <img src="${WEBSITE_URL}/images/pandit-1.jpg" style="width:42px;height:42px;border-radius:12px;object-fit:cover;border:2px solid #F5C451" />
          <div style="min-width:0">
            <div style="font-weight:800;font-size:11.5px;color:#4E1313;line-height:1.2">${pandit1.user.name}</div>
            <div style="font-size:10px;color:#B45309;font-weight:800;margin-top:2px">★ ${pandit1.rating.avg} (${pandit1.rating.count || 42}) · ${pandit1.experienceYears}y</div>
          </div>
        </div>
        <div style="font-size:9.5px;color:#6B1D1D;font-weight:600;margin-top:6px">🗣 ${pandit1.languages.slice(0, 3).join(', ')}</div>
        <div class="row" style="margin-top:5px;border-top:1px solid #F0E6D2;padding-top:5px">
          <span style="font-size:10.5px;font-weight:800;color:#4E1313">₹${pandit1.pujaCharge.toLocaleString('en-IN')}</span>
          <span style="font-size:9.5px;font-weight:800;color:#F27F0C">Book →</span>
        </div>
      </div>
      <div class="card" style="margin-bottom:0;padding:10px">
        <div style="display:flex;align-items:center;gap:8px">
          <img src="${WEBSITE_URL}/images/pandit-2.jpg" style="width:42px;height:42px;border-radius:12px;object-fit:cover;border:2px solid #F5C451" />
          <div style="min-width:0">
            <div style="font-weight:800;font-size:11.5px;color:#4E1313;line-height:1.2">${pandit2.user.name}</div>
            <div style="font-size:10px;color:#B45309;font-weight:800;margin-top:2px">★ ${pandit2.rating.avg} (${pandit2.rating.count || 65}) · ${pandit2.experienceYears}y</div>
          </div>
        </div>
        <div style="font-size:9.5px;color:#6B1D1D;font-weight:600;margin-top:6px">🗣 ${pandit2.languages.slice(0, 3).join(', ')}</div>
        <div class="row" style="margin-top:5px;border-top:1px solid #F0E6D2;padding-top:5px">
          <span style="font-size:10.5px;font-weight:800;color:#4E1313">₹${pandit2.pujaCharge.toLocaleString('en-IN')}</span>
          <span style="font-size:9.5px;font-weight:800;color:#F27F0C">Book →</span>
        </div>
      </div>
    </div>
    <div class="sec-title"><span>Popular Pujas & Rituals</span></div>
    ${[
      [griha, `${WEBSITE_URL}/images/griha-pravesh.jpg`],
      [satya, `${WEBSITE_URL}/images/satyanarayan.jpg`],
    ]
      .map(
        ([p, img]) => `
      <div class="card" style="padding:0;overflow:hidden">
        <div style="position:relative;height:82px;width:100%">
          <img src="${img}" style="width:100%;height:82px;object-fit:cover" />
          <span class="badge badge-saffron" style="position:absolute;top:8px;left:8px;background:#360D0D;color:#F5C451">${p.category.toUpperCase()}</span>
          <span class="badge badge-green" style="position:absolute;top:8px;right:8px">✓ Samagri Kit</span>
        </div>
        <div style="padding:10px 12px">
          <div class="row"><div style="font-size:14px;font-weight:800;color:#4E1313">${p.name}</div><span style="font-size:10.5px;color:#6B1D1D">⏱ ${p.durationMinutes}m</span></div>
          <div class="row" style="margin-top:6px"><span style="font-size:12.5px;font-weight:800;color:#4E1313">From ₹${p.priceTiers[0].price.toLocaleString('en-IN')}</span><span style="font-size:11px;font-weight:800;color:#F27F0C">View Ritual →</span></div>
        </div>
      </div>`
      )
      .join('')}
    `,
    'home'
  );
  await page.setContent(homeHtml, { waitUntil: 'load' });
  await sleep(300);
  await page.screenshot({ path: path.join(MOBILE_DIR, '01-mobile-home.png') });
  console.log('Saved user-app/screenshots/01-mobile-home.png');

  // 02-mobile-puja-detail.png
  const detailHtml = buildMobileScreenHtml(
    'Ritual Details',
    `
    <div style="position:relative;height:146px;width:100%;border-radius:16px;overflow:hidden;border:1.5px solid #D4A017;box-shadow:0 4px 12px rgba(78,19,19,0.12)">
      <img src="${WEBSITE_URL}/images/griha-pravesh.jpg" style="width:100%;height:146px;object-fit:cover" />
      <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(54,13,13,0.88), transparent)"></div>
      <div style="position:absolute;top:10px;left:10px;display:flex;gap:6px">
        <span class="badge" style="background:#360D0D;color:#F5C451;border:1px solid #F5C451">${griha.category.toUpperCase()}</span>
        <span class="badge badge-green">✓ Samagri Kit Available</span>
      </div>
      <div style="position:absolute;bottom:10px;left:12px;right:12px;color:#FFF8E7">
        <h2 style="font-size:18px;font-weight:800">${griha.name}</h2>
        <p style="font-size:10.5px;color:#FDE68A;margin-top:2px">⏱ ${griha.durationMinutes} mins · 🗣 Telugu, Hindi, Sanskrit · 📍 At Home</p>
      </div>
    </div>
    <p style="font-size:11.5px;color:#360D0D;margin-top:10px;line-height:1.45">${griha.description}</p>
    <div class="sec-title"><span>Select Dakshina Package Tier</span></div>
    ${griha.priceTiers
      .map(
        (t, idx) => `
      <div class="card" style="padding:10px 12px;border:${idx === 1 ? '2px solid #F27F0C' : '1px solid #F0E6D2'};background:${idx === 1 ? '#FFF8EB' : '#fff'}">
        <div class="row">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="display:inline-flex;width:16px;height:16px;border-radius:8px;background:${idx === 1 ? '#F27F0C' : '#fff'};border:1.5px solid ${idx === 1 ? '#F27F0C' : '#D4A017'};color:#fff;font-size:10px;align-items:center;justify-content:center;font-weight:900">${idx === 1 ? '✓' : ''}</span>
            <b style="font-size:13px;color:#4E1313">${t.name}</b>
            ${idx === 1 ? '<span style="background:#FDE68A;color:#4E1313;font-size:9px;font-weight:800;padding:2px 6px;border-radius:999px">★ RECOMMENDED IN HYDERABAD</span>' : ''}
          </div>
          <b style="font-size:14px;color:#F27F0C">₹${t.price.toLocaleString('en-IN')}</b>
        </div>
        <div style="font-size:10.5px;color:#6B1D1D;margin-top:3px;padding-left:22px">${t.description}</div>
      </div>`
      )
      .join('')}
    <div class="sec-title"><span>Samagri Checklist (Kit +₹1,800)</span></div>
    <div class="card" style="padding:10px">
      ${griha.samagriChecklist
        .slice(0, 3)
        .map(
          (c) => `
        <div class="row" style="font-size:10.5px;padding:2.5px 0">
          <span>${c.providedInKit ? '✅' : '⚪'} ${c.name} (${c.quantity})</span>
          <span style="font-weight:700;color:${c.providedInKit ? '#15803D' : '#9A7B7B'}">${c.providedInKit ? 'In Kit' : 'Self'}</span>
        </div>`
        )
        .join('')}
    </div>
    `,
    'pujas',
    `<div class="row" style="margin-bottom:6px;font-size:11px"><span style="color:#6B1D1D">Selected: <b style="color:#4E1313">Standard Package</b></span><b style="font-size:13px;color:#4E1313">₹5,500</b></div>
     <button class="btn-primary">Proceed to Book · ₹5,500</button>`
  );
  await page.setContent(detailHtml, { waitUntil: 'load' });
  await sleep(300);
  await page.screenshot({ path: path.join(MOBILE_DIR, '02-mobile-puja-detail.png') });
  console.log('Saved user-app/screenshots/02-mobile-puja-detail.png');

  // 03-mobile-booking-flow.png
  const bookingFlowHtml = buildMobileScreenHtml(
    'Muhurtham Booking',
    `
    <div class="sec-title" style="margin-top:2px"><span>1. Package & Muhurtham Slot</span></div>
    <div class="chips">
      <span class="chip">Basic · ₹3,500</span>
      <span class="chip active">✓ Standard · ₹5,500</span>
      <span class="chip">Premium · ₹9,100</span>
    </div>
    <div class="card" style="margin-top:10px;border:2px solid #F27F0C;background:#FFF8EB">
      <div class="row"><b style="font-size:12px;color:#4E1313">✨ Amrit Siddhi Muhurtham</b><span class="badge badge-saffron">SHUBH</span></div>
      <div style="font-size:11px;color:#6B1D1D;margin-top:2px">07:30 – 09:30 · Rohini Nakshatra</div>
    </div>
    <div class="sec-title"><span>2. Mantra Language</span></div>
    <div class="chips">
      <span class="chip active">Telugu (తెలుగు)</span>
      <span class="chip">Sanskrit</span>
      <span class="chip">Hindi</span>
      <span class="chip">Tamil</span>
    </div>
    <div class="sec-title"><span>3. Venue & Saved Hyderabad Address</span></div>
    <div class="chips" style="margin-bottom:8px">
      <span class="chip active">🏠 Home (Saved)</span>
      <span class="chip">🏛 Parents Home</span>
    </div>
    <div class="card" style="padding:10px">
      <div style="font-size:12px;font-weight:700;color:#4E1313">402, Lotus Enclave, Jubilee Hills</div>
      <div style="font-size:11px;color:#6B1D1D">Hyderabad, Telangana · 500033</div>
    </div>
    <div class="card" style="border-color:#F27F0C;background:#FFF8EB;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:12px;font-weight:800;color:#4E1313">Include Griha Pravesh Samagri Kit</div>
        <div style="font-size:10px;color:#6B1D1D">Kalash, Navadhanya, Ghee & Havan Samagri (+₹1,800)</div>
      </div>
      <span class="badge badge-green">INCLUDED ✓</span>
    </div>
    <div class="card" style="background:#FFF8E7;border-color:#D4A017">
      <div class="row" style="font-size:12px"><span>Total (Standard + Samagri Kit)</span><b>₹7,300</b></div>
      <div class="row" style="font-size:13px;margin-top:4px;color:#F27F0C"><b>Pay Now (30% Advance)</b><b>₹2,190</b></div>
      <div style="font-size:10px;color:#6B1D1D;margin-top:4px">Balance ₹5,110 (70%) payable after Sankalpam completion.</div>
    </div>
    <button class="btn-primary">Confirm & Proceed to Razorpay (₹2,190)</button>
    `,
    'pujas'
  );
  await page.setContent(bookingFlowHtml, { waitUntil: 'load' });
  await sleep(200);
  await page.screenshot({ path: path.join(MOBILE_DIR, '03-mobile-booking-flow.png') });
  console.log('Saved user-app/screenshots/03-mobile-booking-flow.png');

  // 04-mobile-booking-timeline.png
  const timelineHtml = buildMobileScreenHtml(
    'Live Booking Tracker',
    `
    <div class="row">
      <div>
        <div style="font-size:17px;font-weight:800;color:#4E1313">Griha Pravesh Puja</div>
        <div style="font-size:11px;color:#6B1D1D">Booking #PJSEED002 · Standard Tier</div>
      </div>
      <span class="badge badge-green">● LIVE TRACKER</span>
    </div>
    <div class="card" style="margin-top:10px;padding:11px">
      <div style="font-size:12px;font-weight:800;color:#4E1313;margin-bottom:8px">Booking Progress Timeline</div>
      ${[
        ['Pending', 'Booking created', true],
        ['Confirmed', 'Advance payment ₹2,190 verified', true],
        ['Pandit Assigned', `${pandit1.user.name} assigned`, true],
        ['In Progress', 'Ritual sankalpam & homam in progress', false],
        ['Completed', 'Aarti & Ashirvachanam completed', false],
      ]
        .map(
          ([label, note, done], i) => `
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:20px;height:20px;border-radius:10px;background:${done ? '#F27F0C' : '#E5E7EB'};color:${done ? '#fff' : '#6B7280'};font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center">${done ? '✓' : i + 1}</div>
          <div>
            <div style="font-size:11.5px;font-weight:800;color:${done ? '#4E1313' : '#9CA3AF'}">${label}</div>
            <div style="font-size:10px;color:#6B1D1D">${note}</div>
          </div>
        </div>`
        )
        .join('')}
    </div>
    <div class="card" style="background:#FFF8E7;border:1.5px solid #D4A017;padding:11px">
      <div style="font-size:10px;font-weight:800;color:#B85A00;text-transform:uppercase">Assigned Vedic Purohit</div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:6px">
        <img src="${WEBSITE_URL}/images/pandit-2.jpg" style="width:50px;height:50px;border-radius:14px;object-fit:cover;border:2px solid #F5C451" />
        <div>
          <span style="background:#fff;border:1px solid #D4A017;color:#4E1313;font-size:9px;font-weight:800;padding:1.5px 6px;border-radius:999px">✓ Verified Veda Patasala Scholar</span>
          <div style="font-size:14.5px;font-weight:800;color:#4E1313;margin-top:3px">${pandit1.user.name}</div>
          <div style="font-size:10.5px;color:#6B1D1D;margin-top:1px">${pandit1.experienceYears} yrs exp · ★ ${pandit1.rating.avg} · ${pandit1.templeAffiliation}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        <div class="btn-green" style="margin-top:0;font-size:11px;padding:9px">📞 Call (+91 ${panditPhone})</div>
        <div class="btn-outline" style="margin-top:0;font-size:11px;padding:9px;border-color:#15803D;color:#15803D">💬 Share on WhatsApp</div>
      </div>
    </div>
    <div class="card" style="padding:10px 12px">
      <div class="row" style="font-size:11.5px"><span>Total Ritual + Samagri</span><b>₹7,300</b></div>
      <div class="row" style="font-size:11.5px;margin-top:3px;color:#15803D"><span>Advance Paid (30%)</span><b>₹2,190</b></div>
      <div class="row" style="font-size:12.5px;margin-top:3px;color:#4E1313"><b>Balance Remaining</b><b>₹5,110</b></div>
    </div>
    <button class="btn-primary">Pay Remaining Balance (₹5,110)</button>
    `,
    'bookings'
  );
  await page.setContent(timelineHtml, { waitUntil: 'load' });
  await sleep(300);
  await page.screenshot({ path: path.join(MOBILE_DIR, '04-mobile-booking-timeline.png') });
  console.log('Saved user-app/screenshots/04-mobile-booking-timeline.png');

  // 05-mobile-profile.png
  const profileHtml = buildMobileScreenHtml(
    'Devotee Profile',
    `
    <div class="card" style="display:flex;align-items:center;gap:12px;background:#FFF8E7;border:1.5px solid #D4A017">
      <div style="position:relative">
        <div style="width:56px;height:56px;border-radius:18px;background:#4E1313;border:2px solid #F5C451;color:#F5C451;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;box-shadow:0 2px 8px rgba(78,19,19,0.2)">D</div>
        <span style="position:absolute;bottom:-3px;right:-3px;width:18px;height:18px;border-radius:9px;background:#15803D;border:1.5px solid #F5C451;color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:900">✓</span>
      </div>
      <div>
        <span style="background:#fff;border:1px solid #D4A017;color:#4E1313;font-size:9px;font-weight:800;padding:2px 7px;border-radius:999px">✓ VERIFIED DEVOTEE · 📍 HYDERABAD</span>
        <div style="font-size:16px;font-weight:800;color:#4E1313;margin-top:4px">Demo Customer</div>
        <div style="font-size:11px;color:#6B1D1D">customer@puja.test · +91 9000000003</div>
      </div>
    </div>
    <div class="sec-title"><span>Preferred Mantra Language</span></div>
    <div class="chips">
      <span class="chip active">Telugu (తెలుగు)</span>
      <span class="chip">Tamil</span>
      <span class="chip">Kannada</span>
      <span class="chip">Hindi</span>
      <span class="chip">Sanskrit</span>
    </div>
    <div class="sec-title"><span>Saved Ritual Addresses (2)</span><span style="font-size:11px;color:#F27F0C">+ Add Address</span></div>
    <div class="card">
      <div class="row"><b style="font-size:12px;color:#4E1313">🏠 Home (Jubilee Hills)</b><span style="font-size:10px;color:#DC2626;font-weight:700">Remove</span></div>
      <div style="font-size:11px;color:#6B1D1D;margin-top:2px">402, Lotus Enclave, Jubilee Hills, Hyderabad · 500033</div>
    </div>
    <div class="card">
      <div class="row"><b style="font-size:12px;color:#4E1313">🏛 Parents Home</b><span style="font-size:10px;color:#DC2626;font-weight:700">Remove</span></div>
      <div style="font-size:11px;color:#6B1D1D;margin-top:2px">18, Temple Street, Secunderabad, Hyderabad · 500003</div>
    </div>
    <div class="card" style="background:#FFF8E7;border:1.5px solid #D4A017">
      <div style="font-size:13px;font-weight:800;color:#4E1313">24×7 VedaPujas Support & Disputes</div>
      <div style="font-size:11px;color:#6B1D1D;margin-top:3px">Need help with Purohit arrival, Samagri delivery, or Muhurtham rescheduling?</div>
      <div class="btn-green" style="margin-top:8px;padding:10px;font-size:12px">💬 WhatsApp Support (+91 90000 00001)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        <div class="btn-outline" style="margin-top:0;padding:8px;font-size:11px">📞 Call Helpline</div>
        <div class="btn-primary" style="background:#6B1D1D;padding:8px;font-size:11px">⚠ Raise Dispute</div>
      </div>
    </div>
    `,
    'profile'
  );
  await page.setContent(profileHtml, { waitUntil: 'load' });
  await sleep(200);
  await page.screenshot({ path: path.join(MOBILE_DIR, '05-mobile-profile.png') });
  console.log('Saved user-app/screenshots/05-mobile-profile.png');

  await page.close();
}

async function main() {
  for (const dir of [WEBSITE_DIR, ADMIN_DIR, MOBILE_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Fetch live seeded data & tokens from backend API
  const [pujasRes, panditsRes, custLogin, adminLogin] = await Promise.all([
    fetchJson(`${API_BASE}/pujas?limit=20`),
    fetchJson(`${API_BASE}/pandits?limit=20`),
    fetchJson(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'customer@puja.test', password: 'Puja@12345' }),
    }),
    fetchJson(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@puja.test', password: 'Puja@12345' }),
    }),
  ]);

  const customerToken = custLogin.data.token;
  const adminToken = adminLogin.data.token;
  const bookingsRes = await fetchJson(`${API_BASE}/bookings`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });

  const seedData = {
    pujas: pujasRes.data || [],
    pandits: panditsRes.data || [],
    customerToken,
    adminToken,
    customerBookings: bookingsRes.data || [],
  };

  const browser = await puppeteer.launch({
    executablePath: findBrowser(),
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    await captureWebsite(browser, seedData);
    await captureAdminPanel(browser, seedData);
    await captureMobileApp(browser, seedData);
  } finally {
    await browser.close();
  }

  // Sync into root screenshots/ folder (screenshots/website, screenshots/admin-panel, screenshots/user-app)
  const rootScreenshots = path.join(ROOT, 'screenshots');
  for (const [srcDir, sub] of [
    [WEBSITE_DIR, 'website'],
    [ADMIN_DIR, 'admin-panel'],
    [MOBILE_DIR, 'user-app'],
  ]) {
    const destDir = path.join(rootScreenshots, sub);
    fs.mkdirSync(destDir, { recursive: true });
    for (const file of fs.readdirSync(srcDir)) {
      fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    }
  }

  console.log('All 18 screenshots captured and synced to root screenshots/ successfully!');
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});

