/**
 * scripts/lib/fuel-finder-core.mjs
 * Core validation, normalization, and statistical calculation engine
 * for official UK Fuel Finder (Motor Fuel Price Open Data Regulations 2025).
 */

// Bounding box for mainland UK and Northern Ireland
export const UK_BOUNDS = {
  MIN_LAT: 49.5,
  MAX_LAT: 61.5,
  MIN_LNG: -9.0,
  MAX_LNG: 2.5,
};

export const PRICE_LIMITS = {
  MIN_PENCE: 100.0,
  MAX_PENCE: 250.0,
  MAX_AGE_HOURS: 48,
};

/**
 * Validates geographic coordinates to ensure they fall within the UK.
 */
export function validateCoordinates(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return { valid: false, reason: 'Coordinates are missing' };
  }
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  if (isNaN(numLat) || isNaN(numLng)) {
    return { valid: false, reason: 'Coordinates are not numeric' };
  }
  // Reject exact 0, 0
  if (numLat === 0 && numLng === 0) {
    return { valid: false, reason: 'Coordinates are (0, 0)' };
  }
  if (
    numLat < UK_BOUNDS.MIN_LAT ||
    numLat > UK_BOUNDS.MAX_LAT ||
    numLng < UK_BOUNDS.MIN_LNG ||
    numLng > UK_BOUNDS.MAX_LNG
  ) {
    return {
      valid: false,
      reason: `Coordinates (${numLat}, ${numLng}) outside UK bounds [${UK_BOUNDS.MIN_LAT}..${UK_BOUNDS.MAX_LAT}, ${UK_BOUNDS.MIN_LNG}..${UK_BOUNDS.MAX_LNG}]`,
    };
  }
  return { valid: true, latitude: numLat, longitude: numLng };
}

/**
 * Checks if a timestamp is older than maxAgeHours (default: 48h).
 */
export function isPriceExpired(timestamp, referenceTime = new Date(), maxAgeHours = PRICE_LIMITS.MAX_AGE_HOURS) {
  if (!timestamp) return false; // If no timestamp, rely on price value validation
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return false;
  const ref = new Date(referenceTime);
  const ageMs = ref.getTime() - date.getTime();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  return ageMs > maxAgeMs;
}

/**
 * Validates a fuel price: strictly 100 to 250 pence per litre.
 * If expired (>48h), price is marked expired and returned as null.
 */
export function validatePrice(rawPrice, timestamp = null, referenceTime = new Date()) {
  if (rawPrice === null || rawPrice === undefined || rawPrice === '') {
    return { valid: false, price: null, reason: 'Empty price' };
  }

  const num = parseFloat(rawPrice);
  if (isNaN(num)) {
    return { valid: false, price: null, reason: 'Non-numeric price' };
  }

  // Check 100 to 250 pence per litre
  if (num < PRICE_LIMITS.MIN_PENCE || num > PRICE_LIMITS.MAX_PENCE) {
    return {
      valid: false,
      price: null,
      reason: `Price ${num}p outside valid UK range [${PRICE_LIMITS.MIN_PENCE}..${PRICE_LIMITS.MAX_PENCE}p]`,
    };
  }

  // Check age expiration (>48 hours)
  if (timestamp && isPriceExpired(timestamp, referenceTime)) {
    return {
      valid: false,
      price: null,
      isExpired: true,
      originalPrice: +(num.toFixed(1)),
      reason: `Price is expired (>48h old: ${timestamp})`,
    };
  }

  return {
    valid: true,
    price: +(num.toFixed(1)),
    isExpired: false,
  };
}

/**
 * Extracts UK Postcode District (outward code, e.g. "SW1A 1AA" -> "SW1A", "M1 4BT" -> "M1")
 */
export function extractDistrict(postcode) {
  if (!postcode) return '';
  const clean = String(postcode).trim().toUpperCase().replace(/\s+/g, ' ');
  const parts = clean.split(' ');
  if (parts.length > 1) return parts[0];
  const match = clean.match(/^([A-Z]{1,2}[0-9][0-9A-Z]?)/);
  return match ? match[1] : clean.slice(0, 4);
}

/**
 * Standardizes city name based on official address fields or ONS postal area mapping.
 */
export function resolveCity(officialCity, postcode, address) {
  if (officialCity && typeof officialCity === 'string') {
    const trimmed = officialCity.trim();
    if (trimmed.length > 1) {
      // Normalize casing (e.g. "LONDON" -> "London", "MANCHESTER" -> "Manchester")
      return trimmed
        .toLowerCase()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  // Fallback to postcode area mapping
  if (postcode) {
    const clean = String(postcode).trim().toUpperCase();
    const areaMatch = clean.match(/^([A-Z]{1,2})/);
    const area = areaMatch ? areaMatch[1] : '';

    const POSTCODE_CITY_MAP = {
      E: 'London',
      EC: 'London',
      N: 'London',
      NW: 'London',
      SE: 'London',
      SW: 'London',
      W: 'London',
      WC: 'London',
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
    };

    if (POSTCODE_CITY_MAP[area]) {
      return POSTCODE_CITY_MAP[area];
    }
  }

  return 'United Kingdom';
}

/**
 * Computes national average fuel prices from an array of stations.
 */
export function computeNationalAverages(stations) {
  const totals = { E10: 0, E5: 0, B7: 0, SDV: 0 };
  const counts = { E10: 0, E5: 0, B7: 0, SDV: 0 };

  for (const s of stations) {
    for (const fuel of ['E10', 'E5', 'B7', 'SDV']) {
      const price = s.prices?.[fuel];
      if (price !== null && price !== undefined && price >= PRICE_LIMITS.MIN_PENCE && price <= PRICE_LIMITS.MAX_PENCE) {
        totals[fuel] += price;
        counts[fuel] += 1;
      }
    }
  }

  return {
    E10: counts.E10 > 0 ? +(totals.E10 / counts.E10).toFixed(1) : null,
    E5: counts.E5 > 0 ? +(totals.E5 / counts.E5).toFixed(1) : null,
    B7: counts.B7 > 0 ? +(totals.B7 / counts.B7).toFixed(1) : null,
    SDV: counts.SDV > 0 ? +(totals.SDV / counts.SDV).toFixed(1) : null,
  };
}

/**
 * Checks safety guard: if new station count drops by more than 20% compared to previous, abort.
 */
export function checkDropThreshold(prevCount, newCount) {
  if (!prevCount || prevCount <= 0) {
    return { allowed: true };
  }
  const minAllowed = Math.floor(prevCount * 0.8);
  if (newCount < minAllowed) {
    const dropPercent = (((prevCount - newCount) / prevCount) * 100).toFixed(1);
    return {
      allowed: false,
      reason: `Station count dropped by ${dropPercent}% (from ${prevCount} to ${newCount}). Threshold is max 20% drop (minimum required: ${minAllowed}).`,
    };
  }
  return { allowed: true };
}

/**
 * Normalizes a station object according to FuelRadarUK specifications.
 * Discards records missing an ID, without valid UK coordinates, or without any valid prices.
 */
export function normalizeStationRecord({
  nodeId,
  brand,
  name,
  address,
  city,
  postcode,
  latitude,
  longitude,
  pricesRaw,
  timestampsRaw,
  updatedAt,
  referenceTime = new Date(),
}) {
  // 1. Validate ID
  if (!nodeId || String(nodeId).trim() === '') {
    return { success: false, reason: 'Missing official station ID (node_id)' };
  }

  const siteId = String(nodeId).trim();

  // 2. Validate Coordinates
  const coordCheck = validateCoordinates(latitude, longitude);
  if (!coordCheck.valid) {
    return { success: false, reason: coordCheck.reason, siteId };
  }

  // 3. Validate Prices
  const cleanPrices = { E10: null, E5: null, B7: null, SDV: null };
  const cleanTimestamps = { E10: null, E5: null, B7: null, SDV: null };

  const fuelTypes = ['E10', 'E5', 'B7', 'SDV'];
  let validPriceCount = 0;

  for (const ft of fuelTypes) {
    const rawP = pricesRaw?.[ft];
    const ts = timestampsRaw?.[ft] || updatedAt;
    cleanTimestamps[ft] = ts ? new Date(ts).toISOString() : null;

    if (rawP !== undefined && rawP !== null && rawP !== '') {
      const res = validatePrice(rawP, ts, referenceTime);
      if (res.valid) {
        cleanPrices[ft] = res.price;
        validPriceCount++;
      }
    }
  }

  if (validPriceCount === 0) {
    return { success: false, reason: 'No valid (or unexpired) prices between 100-250p', siteId };
  }

  const cleanPostcode = String(postcode || '').trim().toUpperCase();
  const district = extractDistrict(cleanPostcode);
  const cleanCity = resolveCity(city, cleanPostcode, address);

  const cleanBrand = brand && String(brand).trim().length > 0 ? String(brand).trim() : 'Independent';
  const cleanName = name && String(name).trim().length > 0 ? String(name).trim() : `${cleanBrand} ${district || cleanCity}`;

  return {
    success: true,
    station: {
      site_id: siteId,
      brand: cleanBrand,
      name: cleanName,
      address: String(address || '').trim(),
      postcode: cleanPostcode,
      district: district,
      city: cleanCity,
      location: {
        latitude: coordCheck.latitude,
        longitude: coordCheck.longitude,
      },
      prices: cleanPrices,
      price_timestamps: cleanTimestamps,
      updated_at: updatedAt ? new Date(updatedAt).toISOString() : new Date(referenceTime).toISOString(),
    },
  };
}

/**
 * Parses official Fuel Finder CSV text into normalized station list.
 */
export function parseFuelFinderCsv(csvText, referenceTime = new Date()) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { stations: [], discarded: { missing_id: 0, invalid_coords: 0, no_valid_prices: 0, total_discarded: 0 } };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCsvRow(headerLine).map((h) => h.trim());
  const colIndex = {};
  headers.forEach((h, idx) => {
    colIndex[h] = idx;
  });

  const getCol = (row, colName) => {
    const idx = colIndex[colName];
    return idx !== undefined && idx < row.length ? row[idx] : null;
  };

  const stations = [];
  const discarded = {
    missing_id: 0,
    invalid_coords: 0,
    no_valid_prices: 0,
    total_discarded: 0,
    reasons: [],
  };

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i]);
    if (!row || row.length === 0) continue;

    const nodeId = getCol(row, 'forecourts.node_id');
    const tradingName = getCol(row, 'forecourts.trading_name');
    const brandName = getCol(row, 'forecourts.brand_name');
    const postcode = getCol(row, 'forecourts.location.postcode');
    const addr1 = getCol(row, 'forecourts.location.address_line_1') || '';
    const addr2 = getCol(row, 'forecourts.location.address_line_2') || '';
    const fullAddress = [addr1, addr2].filter(Boolean).join(', ');
    const city = getCol(row, 'forecourts.location.city');
    const lat = getCol(row, 'forecourts.location.latitude');
    const lng = getCol(row, 'forecourts.location.longitude');
    const updateTs = getCol(row, 'forecourt_update_timestamp');

    // Prices in Fuel Finder CSV
    // E10, E5, B7S (Standard Diesel), B7P (Premium Diesel)
    const pricesRaw = {
      E10: getCol(row, 'forecourts.fuel_price.E10'),
      E5: getCol(row, 'forecourts.fuel_price.E5'),
      B7: getCol(row, 'forecourts.fuel_price.B7S'),
      SDV: getCol(row, 'forecourts.fuel_price.B7P'),
    };

    const timestampsRaw = {
      E10: getCol(row, 'forecourts.price_submission_timestamp.E10') || updateTs,
      E5: getCol(row, 'forecourts.price_submission_timestamp.E5') || updateTs,
      B7: getCol(row, 'forecourts.price_submission_timestamp.B7S') || updateTs,
      SDV: getCol(row, 'forecourts.price_submission_timestamp.B7P') || updateTs,
    };

    const result = normalizeStationRecord({
      nodeId,
      brand: brandName,
      name: tradingName,
      address: fullAddress,
      city,
      postcode,
      latitude: lat,
      longitude: lng,
      pricesRaw,
      timestampsRaw,
      updatedAt: updateTs,
      referenceTime,
    });

    if (result.success) {
      stations.push(result.station);
    } else {
      discarded.total_discarded++;
      if (result.reason.includes('node_id')) {
        discarded.missing_id++;
      } else if (result.reason.includes('Coordinates') || result.reason.includes('bounds')) {
        discarded.invalid_coords++;
      } else if (result.reason.includes('prices')) {
        discarded.no_valid_prices++;
      }
      if (discarded.reasons.length < 10) {
        discarded.reasons.push(`Line ${i + 1} [${nodeId || 'no-id'}]: ${result.reason}`);
      }
    }
  }

  return { stations, discarded };
}

/**
 * Standard CSV row parser handling quotes and commas.
 */
export function parseCsvRow(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
}
