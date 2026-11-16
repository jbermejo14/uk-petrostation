/**
 * scripts/update-uk-fuel.mjs
 * FuelRadarUK - Official UK CMA Open Data Aggregator
 * 
 * Fetches, validates, and standardises real-time petrol & diesel price feeds
 * from major UK fuel retailers under the UK CMA Temporary Fuel Price Open Data Scheme.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, '../data/uk_stations.json');

// Official CMA Open Data Endpoints & Retailer URLs
const FUEL_FEEDS = [
  {
    brand: 'Asda',
    name: 'Asda Stores Ltd',
    url: 'https://storelocator.asda.com/fuel_prices_data.json',
  },
  {
    brand: "Sainsbury's",
    name: "Sainsbury's Supermarkets Ltd",
    url: 'https://api.sainsburys.co.uk/v1/exports/latest/fuel_prices_data.json',
  },
  {
    brand: 'Morrisons',
    name: 'Wm Morrison Supermarkets Limited',
    url: 'https://service.morrisons.com/fuel-prices-v2.json',
  },
  {
    brand: 'Tesco',
    name: 'Tesco Stores Ltd',
    url: 'https://www.tesco.com/fuel_prices/fuel_prices_data.json',
  },
  {
    brand: 'Applegreen',
    name: 'Applegreen UK',
    url: 'https://applegreenstores.com/fuel-prices/data.json',
  },
  {
    brand: 'Motor Fuel Group',
    name: 'Motor Fuel Group (MFG)',
    url: 'https://fuelprices.motorfuelgroup.com/fuel_prices_data.json',
  },
  {
    brand: 'Rontec',
    name: 'Rontec Roadside Retail',
    url: 'https://www.rontec-servicestations.co.uk/fuel-prices/data.json',
  },
  {
    brand: 'BP',
    name: 'BP Oil UK',
    url: 'https://www.bp.com/en_gb/united-kingdom/home/fuelprices/fuel_prices_data.json',
  },
  {
    brand: 'Esso',
    name: 'Esso Petroleum Company',
    url: 'https://fuelprices.esso.co.uk/en/fuel_prices_data.json',
  },
  {
    brand: 'Shell',
    name: 'Shell UK',
    url: 'https://www.shell.co.uk/fuel-prices-data.html',
  },
  {
    brand: 'SGN Retail',
    name: 'SGN Retail Ltd',
    url: 'https://fuelprices.sgnretail.uk/fuel_prices_data.json',
  },
];

// Helper to extract UK postcode district (e.g., "SW1A 1AA" -> "SW1A", "M1 4BT" -> "M1")
function extractDistrict(postcode) {
  if (!postcode) return '';
  const clean = postcode.trim().toUpperCase().replace(/\s+/g, ' ');
  const parts = clean.split(' ');
  if (parts.length > 1) return parts[0];
  // If no space, split using standard outward code pattern
  const match = clean.match(/^([A-Z]{1,2}[0-9][0-9A-Z]?)/);
  return match ? match[1] : clean.slice(0, 4);
}

// Approximate city detection from postcode area
function deriveCityFromPostcode(postcode, address) {
  if (!postcode) return 'United Kingdom';
  const clean = postcode.toUpperCase().trim();
  const areaMatch = clean.match(/^([A-Z]{1,2})/);
  const area = areaMatch ? areaMatch[1] : '';

  const AREA_MAP = {
    // London
    E: 'London',
    EC: 'London',
    N: 'London',
    NW: 'London',
    SE: 'London',
    SW: 'London',
    W: 'London',
    WC: 'London',
    CR: 'London',
    BR: 'London',
    HA: 'London',
    EN: 'London',
    IG: 'London',
    RM: 'London',
    DA: 'London',
    UB: 'London',
    TW: 'London',
    KT: 'London',
    SM: 'London',
    // Major Cities
    M: 'Manchester',
    B: 'Birmingham',
    CV: 'Coventry',
    LS: 'Leeds',
    G: 'Glasgow',
    EH: 'Edinburgh',
    BS: 'Bristol',
    L: 'Liverpool',
    CF: 'Cardiff',
    NE: 'Newcastle',
    S: 'Sheffield',
    NG: 'Nottingham',
    LE: 'Leicester',
    SO: 'Southampton',
    PL: 'Plymouth',
    AB: 'Aberdeen',
    BT: 'Belfast',
    OX: 'Oxford',
    CB: 'Cambridge',
    NR: 'Norwich',
    EX: 'Exeter',
    BA: 'Bath',
    DY: 'Dudley',
    WS: 'Walsall',
    WV: 'Wolverhampton',
    ST: 'Stoke-on-Trent',
    DE: 'Derby',
    HU: 'Hull',
    PR: 'Preston',
    BL: 'Bolton',
    WN: 'Wigan',
    SK: 'Stockport',
    OL: 'Oldham',
    WA: 'Warrington',
    CH: 'Chester',
    SA: 'Swansea',
    NP: 'Newport',
  };

  if (AREA_MAP[area]) return AREA_MAP[area];

  // Try extracting from address lines
  if (address) {
    const addressLower = address.toLowerCase();
    for (const city of [
      'Manchester', 'Birmingham', 'Coventry', 'Leeds', 'Glasgow', 
      'Edinburgh', 'Bristol', 'Liverpool', 'Cardiff', 'Newcastle', 
      'Sheffield', 'Nottingham', 'Leicester', 'Southampton', 'London'
    ]) {
      // Use boundary match to avoid false positives like "North London Road"
      const regex = new RegExp(`\\b${city.toLowerCase()}\\b`);
      if (regex.test(addressLower)) return city;
    }
  }

  return 'United Kingdom';
}

// Fetch single feed with timeout and custom headers
async function fetchFeed(feed) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const response = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FuelRadarUK-Bot/1.0 (+https://fuelradar.co.uk/cma-sync)',
        'Accept': 'application/json, text/plain, */*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    // Some feeds have leading UTF-8 BOM or HTML wrappers
    const jsonStart = text.indexOf('{');
    if (jsonStart === -1) {
      throw new Error('No JSON object found in response body');
    }
    const cleanJson = text.slice(jsonStart);
    const data = JSON.parse(cleanJson);
    return { success: true, feed, data };
  } catch (err) {
    clearTimeout(timeoutId);
    return { success: false, feed, error: err.message };
  }
}

// Normalize individual station object from CMA schema
function normalizeStation(raw, defaultBrand) {
  try {
    const site_id = raw.site_id || raw.id || `${defaultBrand.toLowerCase()}-${Math.random().toString(36).substring(2, 9)}`;
    const brand = raw.brand || defaultBrand;
    const address = raw.address || '';
    const postcode = (raw.postcode || '').trim().toUpperCase();
    const district = extractDistrict(postcode);
    const city = deriveCityFromPostcode(postcode, address);

    // Location coordinates
    let lat = null;
    let lng = null;
    if (raw.location) {
      lat = parseFloat(raw.location.latitude ?? raw.location.lat);
      lng = parseFloat(raw.location.longitude ?? raw.location.lng);
    } else {
      lat = parseFloat(raw.latitude ?? raw.lat);
      lng = parseFloat(raw.longitude ?? raw.lng);
    }

    // Prices normalization (ensure numbers in pence, e.g. 132.9)
    const rawPrices = raw.prices || {};
    const parsePrice = (val) => {
      if (val === undefined || val === null || val === '') return null;
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) return null;
      // In case any retailer provides price in pounds (£1.329), convert to pence
      return num < 10 ? +(num * 100).toFixed(1) : +(num).toFixed(1);
    };

    const prices = {
      E10: parsePrice(rawPrices.E10 ?? rawPrices.e10 ?? rawPrices.unleaded),
      E5: parsePrice(rawPrices.E5 ?? rawPrices.e5 ?? rawPrices['super unleaded']),
      B7: parsePrice(rawPrices.B7 ?? rawPrices.b7 ?? rawPrices.diesel),
      SDV: parsePrice(rawPrices.SDV ?? rawPrices.sdv ?? rawPrices['super diesel']),
    };

    // Need at least one valid price and coordinates to be helpful
    if (!prices.E10 && !prices.B7 && !prices.E5 && !prices.SDV) {
      return null;
    }

    return {
      site_id: String(site_id),
      brand: String(brand),
      name: raw.name || `${brand} ${district || city}`,
      address: String(address),
      postcode: postcode,
      district: district,
      city: city,
      location: {
        latitude: isNaN(lat) ? 51.5074 : lat,
        longitude: isNaN(lng) ? -0.1278 : lng,
      },
      prices: prices,
      updated_at: raw.last_updated || new Date().toISOString(),
    };
  } catch (err) {
    return null;
  }
}

async function run() {
  console.log('====================================================');
  console.log('  FuelRadarUK - UK Fuel Price Aggregator (CMA Feed)');
  console.log('====================================================');
  console.log(`Starting fetch across ${FUEL_FEEDS.length} official UK retailer feeds...\n`);

  // Load existing dataset first as fallback / baseline
  let existingStations = [];
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    existingStations = parsed.stations || [];
    console.log(`[Baseline] Loaded ${existingStations.length} existing stations from uk_stations.json`);
  } catch (e) {
    console.warn(`[Notice] No existing uk_stations.json found or unreadable. Will create fresh.`);
  }

  const results = await Promise.allSettled(FUEL_FEEDS.map((feed) => fetchFeed(feed)));

  const stationMap = new Map();
  // Pre-seed with existing stations so we never lose historical data or manual test coverage
  for (const s of existingStations) {
    stationMap.set(s.site_id, s);
  }

  let totalNewMerged = 0;
  let successfulFeeds = 0;

  for (const res of results) {
    if (res.status === 'fulfilled') {
      const outcome = res.value;
      if (outcome.success) {
        successfulFeeds++;
        const rawStations = outcome.data.stations || outcome.data.items || [];
        console.log(`[OK] ${outcome.feed.brand}: Fetched ${rawStations.length} stations.`);
        
        for (const raw of rawStations) {
          const norm = normalizeStation(raw, outcome.feed.brand);
          if (norm && norm.site_id) {
            stationMap.set(norm.site_id, norm);
            totalNewMerged++;
          }
        }
      } else {
        console.warn(`[Skip] ${outcome.feed.brand} endpoint unavailable (${outcome.error}). Retaining cached/sample data.`);
      }
    }
  }

  const mergedStations = Array.from(stationMap.values());

  const outputPayload = {
    last_updated: new Date().toISOString(),
    source: 'UK CMA Open Data Aggregation (FuelRadarUK)',
    total_stations: mergedStations.length,
    feeds_queried: FUEL_FEEDS.length,
    successful_feeds: successfulFeeds,
    stations: mergedStations,
  };

  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(outputPayload, null, 2), 'utf-8');

  console.log('\n====================================================');
  console.log(`Successfully merged ${mergedStations.length} stations into data/uk_stations.json!`);
  console.log(`Timestamp: ${outputPayload.last_updated}`);
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('[Error] Aggregator encountered an unhandled exception:', err);
  process.exit(1);
});
