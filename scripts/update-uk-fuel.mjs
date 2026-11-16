/**
 * scripts/update-uk-fuel.mjs
 * Official UK Fuel Finder Data Importer
 * 
 * Implements The Motor Fuel Price (Open Data) Regulations 2025.
 * Ingests live UK petrol & diesel prices and forecourt data via:
 * 1. Official Fuel Finder REST API (OAuth 2.0 Client Credentials flow)
 * 2. Official Fuel Finder CSV extract (via --csv flag or env variable)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeStationRecord,
  parseFuelFinderCsv,
  computeNationalAverages,
  checkDropThreshold,
} from './lib/fuel-finder-core.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, '../data/uk_stations.json');
const TEMP_DATA_PATH = path.resolve(__dirname, '../data/uk_stations.json.tmp');

const USER_AGENT = 'FuelRadarUK/1.0 (+https://fuelradar.co.uk)';

/**
 * Loads .env file if present without external dependencies
 */
async function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  try {
    const raw = await fs.readFile(envPath, 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (e) {
    // .env is optional
  }
}

/**
 * Fetch OAuth 2.0 Access Token from Fuel Finder
 */
async function getApiAccessToken(baseUrl, clientId, clientSecret) {
  const tokenUrl = `${baseUrl}/oauth/generate_access_token`;
  console.log(`[Auth] Requesting OAuth access token from ${tokenUrl}...`);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Authentication failed (HTTP ${response.status}): ${errText}`);
  }

  const json = await response.json();
  const tokenData = json.data || json;
  if (!tokenData.access_token) {
    throw new Error('No access_token found in response from Fuel Finder auth endpoint');
  }

  return tokenData.access_token;
}

/**
 * Fetches all batches from a paginated Fuel Finder API endpoint
 */
async function fetchAllApiBatches(baseUrl, endpoint, token) {
  const items = [];
  let batchNumber = 1;
  const maxBatches = 60; // Up to 30,000 forecourts

  console.log(`[API] Fetching batches from ${endpoint}...`);

  while (batchNumber <= maxBatches) {
    const url = `${baseUrl}${endpoint}?batch-number=${batchNumber}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (response.status === 404) {
      // Reached the end of available batches
      break;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint} batch ${batchNumber}: HTTP ${response.status}`);
    }

    const batchData = await response.json();
    const records = Array.isArray(batchData) ? batchData : batchData.data || [];

    if (records.length === 0) {
      break;
    }

    items.push(...records);
    if (records.length < 500) {
      break; // Last batch
    }

    batchNumber++;
  }

  return items;
}

/**
 * Imports from Fuel Finder REST API
 */
async function importFromApi(clientId, clientSecret, env = 'production') {
  const baseUrl =
    env === 'test'
      ? 'https://test.fuel-finder.service.gov.uk/api/v1'
      : 'https://www.fuel-finder.service.gov.uk/api/v1';

  const token = await getApiAccessToken(baseUrl, clientId, clientSecret);
  const forecourts = await fetchAllApiBatches(baseUrl, '/pfs', token);
  const priceRecords = await fetchAllApiBatches(baseUrl, '/pfs/fuel-prices', token);

  console.log(`[API] Received ${forecourts.length} forecourts and ${priceRecords.length} price records.`);

  // Map prices by node_id
  const priceMap = new Map();
  for (const pr of priceRecords) {
    if (pr.node_id) {
      priceMap.set(pr.node_id, pr.fuel_prices || []);
    }
  }

  const stations = [];
  const discarded = {
    missing_id: 0,
    invalid_coords: 0,
    no_valid_prices: 0,
    total_discarded: 0,
    reasons: [],
  };

  const now = new Date();

  for (const fc of forecourts) {
    const nodeId = fc.node_id;
    const loc = fc.location || {};
    const rawPricesList = priceMap.get(nodeId) || [];

    const pricesRaw = {};
    const timestampsRaw = {};

    for (const p of rawPricesList) {
      const fuelType = (p.fuel_type || '').toUpperCase();
      let key = null;
      if (fuelType === 'E10') key = 'E10';
      else if (fuelType === 'E5') key = 'E5';
      else if (fuelType === 'B7' || fuelType === 'B7S' || fuelType === 'DIESEL') key = 'B7';
      else if (fuelType === 'SDV' || fuelType === 'B7P' || fuelType === 'SUPER DIESEL') key = 'SDV';

      if (key) {
        pricesRaw[key] = p.price;
        timestampsRaw[key] = p.price_last_updated || p.price_change_effective_timestamp;
      }
    }

    const norm = normalizeStationRecord({
      nodeId,
      brand: fc.brand_name || fc.trading_name,
      name: fc.trading_name,
      address: [loc.address_line_1, loc.address_line_2].filter(Boolean).join(', '),
      city: loc.city,
      postcode: loc.postcode,
      latitude: loc.latitude,
      longitude: loc.longitude,
      pricesRaw,
      timestampsRaw,
      updatedAt: now.toISOString(),
      referenceTime: now,
    });

    if (norm.success) {
      stations.push(norm.station);
    } else {
      discarded.total_discarded++;
      if (norm.reason.includes('node_id')) discarded.missing_id++;
      else if (norm.reason.includes('Coordinates') || norm.reason.includes('bounds')) discarded.invalid_coords++;
      else if (norm.reason.includes('prices')) discarded.no_valid_prices++;

      if (discarded.reasons.length < 15) {
        discarded.reasons.push(`[${nodeId || 'no-id'}]: ${norm.reason}`);
      }
    }
  }

  return { stations, discarded };
}

/**
 * Imports from official Fuel Finder CSV file (local or remote)
 */
async function importFromCsv(csvSource) {
  console.log(`[CSV] Ingesting from CSV source: ${csvSource}...`);
  let csvText = '';

  if (csvSource.startsWith('http://') || csvSource.startsWith('https://')) {
    const res = await fetch(csvSource, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/csv, text/plain, */*',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch remote CSV (HTTP ${res.status} ${res.statusText})`);
    }
    csvText = await res.text();
  } else {
    const resolvedPath = path.resolve(process.cwd(), csvSource);
    csvText = await fs.readFile(resolvedPath, 'utf-8');
  }

  return parseFuelFinderCsv(csvText, new Date());
}

async function run() {
  await loadEnv();

  console.log('====================================================');
  console.log('  FuelRadarUK - Official Fuel Finder Importer');
  console.log('  The Motor Fuel Price (Open Data) Regulations 2025');
  console.log('====================================================\n');

  // Check command line args
  const args = process.argv.slice(2);
  let csvArg = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--csv' && args[i + 1]) {
      csvArg = args[i + 1];
      break;
    } else if (args[i].startsWith('--csv=')) {
      csvArg = args[i].split('=')[1];
      break;
    }
  }

  const clientId = process.env.FUEL_FINDER_CLIENT_ID;
  const clientSecret = process.env.FUEL_FINDER_CLIENT_SECRET;
  const environment = process.env.FUEL_FINDER_ENVIRONMENT || 'production';
  const csvEnv = process.env.FUEL_FINDER_CSV_PATH || process.env.FUEL_FINDER_CSV_URL;

  let importResult = null;

  if (csvArg || csvEnv) {
    const source = csvArg || csvEnv;
    importResult = await importFromCsv(source);
  } else if (clientId && clientSecret) {
    console.log(`[Mode] Connecting to Fuel Finder REST API (${environment} environment)...`);
    importResult = await importFromApi(clientId, clientSecret, environment);
  } else {
    console.warn('\n[Notice] No Fuel Finder credentials or CSV source configured.');
    console.warn('To import live data, provide either:');
    console.warn('  1. FUEL_FINDER_CLIENT_ID and FUEL_FINDER_CLIENT_SECRET in .env (or environment)');
    console.warn('  2. --csv <path-to-csv-or-url> flag');
    console.warn('  3. FUEL_FINDER_CSV_PATH or FUEL_FINDER_CSV_URL in .env\n');
    console.warn('See .env.example and README.md for instructions.\n');
    process.exit(1);
  }

  const { stations, discarded } = importResult;

  console.log('\n[Summary: Validation & Cleansing]');
  console.log(`  Valid stations retained: ${stations.length}`);
  console.log(`  Total records discarded: ${discarded.total_discarded}`);
  console.log(`    - Missing ID (node_id): ${discarded.missing_id}`);
  console.log(`    - Invalid / Out-of-UK Coordinates: ${discarded.invalid_coords}`);
  console.log(`    - No valid unexpired prices (100-250p): ${discarded.no_valid_prices}`);

  if (discarded.reasons.length > 0) {
    console.log('\n  Sample discard reasons:');
    discarded.reasons.slice(0, 5).forEach((r) => console.log(`    • ${r}`));
  }

  // Load existing file to check safety drop guard
  let prevCount = 0;
  try {
    const existingRaw = await fs.readFile(DATA_PATH, 'utf-8');
    const existingParsed = JSON.parse(existingRaw);
    prevCount = existingParsed.total_stations || (existingParsed.stations || []).length;
    console.log(`\n[Safety Guard] Previous station count: ${prevCount}`);
  } catch (e) {
    console.log('\n[Safety Guard] No previous dataset found to compare.');
  }

  // Check drop threshold: abort if station count drops >20%
  const dropCheck = checkDropThreshold(prevCount, stations.length);
  if (!dropCheck.allowed) {
    console.error(`\n[FATAL ERROR - SAFETY GUARD TRIGGERED]`);
    console.error(`  ${dropCheck.reason}`);
    console.error(`  Aborting update without modifying ${DATA_PATH}.\n`);
    process.exit(1);
  }

  // Calculate national averages from the imported valid stations
  const nationalAverages = computeNationalAverages(stations);
  console.log('\n[Computed UK National Averages]');
  console.log(`  Unleaded (E10):     ${nationalAverages.E10 ?? 'N/A'}p`);
  console.log(`  Super (E5):        ${nationalAverages.E5 ?? 'N/A'}p`);
  console.log(`  Diesel (B7):       ${nationalAverages.B7 ?? 'N/A'}p`);
  console.log(`  Super Diesel (SDV): ${nationalAverages.SDV ?? 'N/A'}p`);

  const payload = {
    last_updated: new Date().toISOString(),
    source: 'Fuel Finder, Open Government Licence v3.0',
    licence: 'Contains public sector information licensed under the Open Government Licence v3.0',
    total_stations: stations.length,
    national_averages: nationalAverages,
    discarded_summary: {
      missing_id: discarded.missing_id,
      invalid_coords: discarded.invalid_coords,
      no_valid_prices: discarded.no_valid_prices,
      total_discarded: discarded.total_discarded,
    },
    stations: stations,
  };

  // Atomic file write: write to temp file first, then atomically rename
  console.log(`\n[Disk] Writing ${stations.length} stations atomically to ${DATA_PATH}...`);
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(TEMP_DATA_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  await fs.rename(TEMP_DATA_PATH, DATA_PATH);

  console.log('====================================================');
  console.log(`Successfully updated ${DATA_PATH}!`);
  console.log(`Total active stations: ${stations.length}`);
  console.log(`Timestamp: ${payload.last_updated}`);
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('[Error] Fuel Finder importer terminated with exception:', err.message);
  process.exit(1);
});
