/**
 * tests/fuel-finder.test.mjs
 * Offline Unit Tests with Fixtures for UK Fuel Finder Integration
 * 
 * Verifies:
 * 1. Normalization of API & CSV records
 * 2. Price validation (strictly 100 - 250 pence/litre)
 * 3. Discarding invalid records (missing ID, out-of-UK coordinates, no valid prices)
 * 4. Price expiration (> 48 hours)
 * 5. 20% station count drop protection
 * 6. Calculation of national averages
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCoordinates,
  validatePrice,
  isPriceExpired,
  extractDistrict,
  resolveCity,
  computeNationalAverages,
  checkDropThreshold,
  normalizeStationRecord,
  parseFuelFinderCsv,
  buildLiveDatasetPayload,
} from '../scripts/lib/fuel-finder-core.mjs';
import { readFileSync } from 'node:fs';

describe('1. Price Validation (100 - 250 pence/litre)', () => {
  const refTime = new Date('2026-11-16T12:00:00Z');

  test('accepts valid price within 100-250p range', () => {
    const res = validatePrice(139.9, '2026-11-16T10:00:00Z', refTime);
    assert.equal(res.valid, true);
    assert.equal(res.price, 139.9);
    assert.equal(res.isExpired, false);
  });

  test('accepts boundary prices 100.0p and 250.0p', () => {
    const minRes = validatePrice('100.0', '2026-11-16T10:00:00Z', refTime);
    const maxRes = validatePrice('250.0', '2026-11-16T10:00:00Z', refTime);
    assert.equal(minRes.valid, true);
    assert.equal(minRes.price, 100.0);
    assert.equal(maxRes.valid, true);
    assert.equal(maxRes.price, 250.0);
  });

  test('rejects prices under 100p (e.g. 1.39 or 98p) without guessing conversions', () => {
    const tooLowPound = validatePrice(1.39, null, refTime);
    assert.equal(tooLowPound.valid, false);
    assert.match(tooLowPound.reason, /outside valid UK range/);

    const tooLowPence = validatePrice(98.5, null, refTime);
    assert.equal(tooLowPence.valid, false);
    assert.match(tooLowPence.reason, /outside valid UK range/);
  });

  test('rejects prices above 250p (e.g. 299.9 or 1399)', () => {
    const tooHigh = validatePrice(260.0, null, refTime);
    assert.equal(tooHigh.valid, false);
    assert.match(tooHigh.reason, /outside valid UK range/);
  });

  test('rejects empty or non-numeric prices', () => {
    assert.equal(validatePrice('', null, refTime).valid, false);
    assert.equal(validatePrice(null, null, refTime).valid, false);
    assert.equal(validatePrice('N/A', null, refTime).valid, false);
  });
});

describe('2. Coordinates Validation & UK Bounding Box', () => {
  test('accepts valid UK coordinates (London, Manchester, Edinburgh, Cardiff)', () => {
    // London
    assert.equal(validateCoordinates(51.5074, -0.1278).valid, true);
    // Manchester
    assert.equal(validateCoordinates(53.4808, -2.2426).valid, true);
    // Edinburgh
    assert.equal(validateCoordinates(55.9533, -3.1883).valid, true);
    // Cardiff
    assert.equal(validateCoordinates(51.4816, -3.1791).valid, true);
    // Belfast
    assert.equal(validateCoordinates(54.5973, -5.9301).valid, true);
  });

  test('rejects missing, null or non-numeric coordinates', () => {
    assert.equal(validateCoordinates(null, -0.12).valid, false);
    assert.equal(validateCoordinates(51.5, undefined).valid, false);
    assert.equal(validateCoordinates('abc', -0.12).valid, false);
  });

  test('rejects (0, 0) coordinates (Null Island)', () => {
    const res = validateCoordinates(0, 0);
    assert.equal(res.valid, false);
    assert.match(res.reason, /\(0, 0\)/);
  });

  test('rejects coordinates outside the UK', () => {
    // Paris, France (lat 48.85, lng 2.35) - too far south
    assert.equal(validateCoordinates(48.85, 2.35).valid, false);
    // New York, USA (lat 40.71, lng -74.0) - far west
    assert.equal(validateCoordinates(40.71, -74.0).valid, false);
    // Sydney, Australia (lat -33.86, lng 151.2) - southern hemisphere
    assert.equal(validateCoordinates(-33.86, 151.2).valid, false);
  });
});

describe('3. Price Expiration (> 48 hours)', () => {
  const refTime = new Date('2026-11-16T12:00:00Z');

  test('accepts price updated 2 hours ago', () => {
    const ts2h = new Date('2026-11-16T10:00:00Z').toISOString();
    assert.equal(isPriceExpired(ts2h, refTime), false);

    const valRes = validatePrice(142.9, ts2h, refTime);
    assert.equal(valRes.valid, true);
    assert.equal(valRes.isExpired, false);
  });

  test('marks price updated 49 hours ago as expired', () => {
    const ts49h = new Date('2026-11-14T11:00:00Z').toISOString();
    assert.equal(isPriceExpired(ts49h, refTime), true);

    const valRes = validatePrice(142.9, ts49h, refTime);
    assert.equal(valRes.valid, false);
    assert.equal(valRes.isExpired, true);
    assert.equal(valRes.price, null);
    assert.match(valRes.reason, /expired/);
  });
});

describe('4. Record Normalization & Incomplete Record Discarding', () => {
  const refTime = new Date('2026-11-16T12:00:00Z');

  test('successfully normalizes a valid Fuel Finder record', () => {
    const res = normalizeStationRecord({
      nodeId: 'ff-site-001',
      brand: 'Tesco',
      name: 'Tesco Extra Kensington',
      address: 'West Cromwell Road',
      city: 'London',
      postcode: 'W14 8PB',
      latitude: 51.4952,
      longitude: -0.2031,
      pricesRaw: { E10: '135.9', B7: '141.9' },
      timestampsRaw: {
        E10: '2026-11-16T10:00:00Z',
        B7: '2026-11-16T10:00:00Z',
      },
      updatedAt: '2026-11-16T10:00:00Z',
      referenceTime: refTime,
    });

    assert.equal(res.success, true);
    assert.equal(res.station.site_id, 'ff-site-001');
    assert.equal(res.station.brand, 'Tesco');
    assert.equal(res.station.city, 'London');
    assert.equal(res.station.district, 'W14');
    assert.equal(res.station.prices.E10, 135.9);
    assert.equal(res.station.prices.B7, 141.9);
    assert.equal(res.station.prices.E5, null);
    assert.equal(res.station.prices.SDV, null);
  });

  test('discards record without official node_id', () => {
    const res = normalizeStationRecord({
      nodeId: '',
      brand: 'Shell',
      name: 'Shell Edgware',
      address: 'Edgware Road',
      latitude: 51.5209,
      longitude: -0.1714,
      pricesRaw: { E10: '141.9' },
      referenceTime: refTime,
    });

    assert.equal(res.success, false);
    assert.match(res.reason, /node_id/);
  });

  test('discards record with coordinates outside UK bounds', () => {
    const res = normalizeStationRecord({
      nodeId: 'ff-site-bad-coords',
      brand: 'BP',
      name: 'BP International',
      address: 'Boulevard de Paris',
      latitude: 45.0, // Outside UK
      longitude: 2.0,
      pricesRaw: { E10: '141.9' },
      referenceTime: refTime,
    });

    assert.equal(res.success, false);
    assert.match(res.reason, /outside UK bounds/);
  });

  test('discards record when all prices are expired or invalid', () => {
    const res = normalizeStationRecord({
      nodeId: 'ff-site-expired',
      brand: 'Asda',
      name: 'Asda Old Price',
      address: 'High St',
      latitude: 51.5,
      longitude: -0.1,
      pricesRaw: { E10: '130.0' },
      timestampsRaw: { E10: '2026-11-10T08:00:00Z' }, // >5 days old
      referenceTime: refTime,
    });

    assert.equal(res.success, false);
    assert.match(res.reason, /No valid \(or unexpired\) prices/);
  });
});

describe('5. Station Count Drop Threshold Protection (>20%)', () => {
  test('allows new count when drop is <= 20%', () => {
    // 1000 down to 850 is a 15% drop -> allowed
    const res = checkDropThreshold(1000, 850);
    assert.equal(res.allowed, true);

    // Exact 20% drop (1000 -> 800) -> allowed
    const res2 = checkDropThreshold(1000, 800);
    assert.equal(res2.allowed, true);
  });

  test('aborts when new count drops by more than 20%', () => {
    // 1000 down to 750 is a 25% drop -> disallowed
    const res = checkDropThreshold(1000, 750);
    assert.equal(res.allowed, false);
    assert.match(res.reason, /dropped by 25.0%/);
  });

  test('allows first execution when previous count is 0', () => {
    const res = checkDropThreshold(0, 500);
    assert.equal(res.allowed, true);
  });
});

describe('6. Calculation of National Averages', () => {
  test('computes accurate national averages from station fixtures', () => {
    const stationsFixture = [
      {
        site_id: 's1',
        prices: { E10: 130.0, E5: 140.0, B7: 136.0, SDV: 146.0 },
      },
      {
        site_id: 's2',
        prices: { E10: 134.0, E5: 144.0, B7: 140.0, SDV: null },
      },
      {
        site_id: 's3',
        prices: { E10: 132.0, E5: null, B7: 138.0, SDV: 148.0 },
      },
    ];

    const avgs = computeNationalAverages(stationsFixture);
    // E10: (130 + 134 + 132) / 3 = 132.0
    assert.equal(avgs.E10, 132.0);
    // E5: (140 + 144) / 2 = 142.0
    assert.equal(avgs.E5, 142.0);
    // B7: (136 + 140 + 138) / 3 = 138.0
    assert.equal(avgs.B7, 138.0);
    // SDV: (146 + 148) / 2 = 147.0
    assert.equal(avgs.SDV, 147.0);
  });
});

describe('7. Official CSV Parsing with Fixture Data', () => {
  const refTime = new Date('2026-11-16T12:00:00Z');

  const csvFixture = `forecourt_update_timestamp,forecourts.node_id,forecourts.trading_name,forecourts.brand_name,forecourts.is_motorway_service_station,forecourts.is_supermarket_service_station,forecourts.public_phone_number,forecourts.temporary_closure,forecourts.permanent_closure,forecourts.permanent_closure_date,forecourts.location.postcode,forecourts.location.address_line_1,forecourts.location.address_line_2,forecourts.location.city,forecourts.location.county,forecourts.location.country,forecourts.location.latitude,forecourts.location.longitude,forecourts.fuel_price.E5,forecourts.price_submission_timestamp.E5,forecourts.price_change_effective_timestamp.E5,forecourts.fuel_price.E10,forecourts.price_submission_timestamp.E10,forecourts.price_change_effective_timestamp.E10,forecourts.fuel_price.B7S,forecourts.price_submission_timestamp.B7S,forecourts.price_change_effective_timestamp.B7S,forecourts.fuel_price.B7P,forecourts.price_submission_timestamp.B7P,forecourts.price_change_effective_timestamp.B7P,forecourts.fuel_price.B10,forecourts.price_submission_timestamp.B10,forecourts.price_change_effective_timestamp.B10,forecourts.fuel_price.HVO,forecourts.price_submission_timestamp.HVO,forecourts.price_change_effective_timestamp.HVO
2026-11-16T10:00:00Z,node-valid-1,MANCHESTER CENTRAL,ASDA,false,true,+44161111111,false,false,,M1 4BT,ASHTON OLD ROAD,,MANCHESTER,GREATER MANCHESTER,England,53.4774,-2.2346,,,,132.9000,2026-11-16T10:00:00Z,2026-11-16T10:00:00Z,138.9000,2026-11-16T10:00:00Z,2026-11-16T10:00:00Z,,,,,,,,,
2026-11-16T10:00:00Z,node-valid-2,KENSINGTON EXTRA,TESCO,false,true,+44207111111,false,false,,W14 8PB,WEST CROMWELL ROAD,,LONDON,GREATER LONDON,England,51.4952,-0.2031,142.9000,2026-11-16T10:00:00Z,2026-11-16T10:00:00Z,134.9000,2026-11-16T10:00:00Z,2026-11-16T10:00:00Z,139.9000,2026-11-16T10:00:00Z,2026-11-16T10:00:00Z,149.9000,2026-11-16T10:00:00Z,2026-11-16T10:00:00Z,,,,,,
2026-11-16T10:00:00Z,,MISSING ID SITE,SHELL,false,false,,false,false,,SW1A 1AA,WHITEHALL,,LONDON,,England,51.5014,-0.1419,,,,145.9000,2026-11-16T10:00:00Z,2026-11-16T10:00:00Z,150.9000,2026-11-16T10:00:00Z,2026-11-16T10:00:00Z,,,,,,,,,
2026-11-16T10:00:00Z,node-bad-coords,OFFSHORE STATION,BP,false,false,,false,false,,XX1 1XX,OCEAN ROAD,,ATLANTIC,,England,30.0000,-40.0000,,,,145.9000,2026-11-16T10:00:00Z,2026-11-16T10:00:00Z,150.9000,2026-11-16T10:00:00Z,2026-11-16T10:00:00Z,,,,,,,,,
2026-11-10T10:00:00Z,node-expired,EXPIRED STATION,ESSO,false,false,,false,false,,B1 1AA,NEW STREET,,BIRMINGHAM,,England,52.4800,-1.9026,,,,135.9000,2026-11-10T10:00:00Z,2026-11-10T10:00:00Z,140.9000,2026-11-10T10:00:00Z,2026-11-10T10:00:00Z,,,,,,,,,`;

  test('parses CSV, retains valid stations and properly categorizes discards', () => {
    const { stations, discarded } = parseFuelFinderCsv(csvFixture, refTime);

    assert.equal(stations.length, 2);
    assert.equal(stations[0].site_id, 'node-valid-1');
    assert.equal(stations[0].city, 'Manchester');
    assert.equal(stations[0].prices.E10, 132.9);
    assert.equal(stations[0].prices.B7, 138.9);

    assert.equal(stations[1].site_id, 'node-valid-2');
    assert.equal(stations[1].city, 'London');
    assert.equal(stations[1].prices.E10, 134.9);
    assert.equal(stations[1].prices.E5, 142.9);
    assert.equal(stations[1].prices.B7, 139.9);
    assert.equal(stations[1].prices.SDV, 149.9);

    // 3 rows should be discarded: missing ID, bad coords, expired prices
    assert.equal(discarded.total_discarded, 3);
    assert.equal(discarded.missing_id, 1);
    assert.equal(discarded.invalid_coords, 1);
    assert.equal(discarded.no_valid_prices, 1);
  });
});

describe('Dataset provenance metadata', () => {
  const discardedFixture = {
    missing_id: 1,
    invalid_coords: 2,
    no_valid_prices: 3,
    total_discarded: 6,
  };

  test('importer payload declares Fuel Finder as a live source', () => {
    const now = new Date('2026-12-01T08:30:00Z');
    const payload = buildLiveDatasetPayload({
      stations: [{ site_id: 'a' }],
      discarded: discardedFixture,
      nationalAverages: { E10: 140, E5: null, B7: 150, SDV: null },
      now,
    });

    assert.equal(payload.source, 'Fuel Finder');
    assert.equal(payload.isLiveSource, true);
    assert.equal(payload.snapshotDate, '2026-12-01T08:30:00.000Z');
    assert.equal(payload.total_stations, 1);
    assert.equal(payload.discarded_summary.total_discarded, 6);
  });

  test('committed dataset declares itself as a non-live CMA snapshot', () => {
    const dataset = JSON.parse(
      readFileSync(new URL('../data/uk_stations.json', import.meta.url), 'utf-8')
    );

    assert.equal(dataset.isLiveSource, false);
    assert.match(dataset.source, /CMA interim fuel price scheme/);
    assert.ok(!('licence' in dataset), 'la instantánea CMA no debe declarar licencia OGL');
    assert.ok(!Number.isNaN(Date.parse(dataset.snapshotDate)));
    assert.equal(dataset.total_stations, dataset.stations.length);
  });
});
