/**
 * src/lib/data.ts
 * Core data access, statistical computations, and fuel pricing models for FuelRadarUK.
 */

import stationsData from '../../data/uk_stations.json';
import { FuelStation, FuelType, SortOption, CitySummary } from '@/types/fuel';
import { calculateDistanceMiles, UK_CITIES, POSTCODE_DISTRICT_COORDS } from './geo';

// Current UK National Average Fuel Benchmarks (CMA / RAC Fuel Watch standard)
export const UK_NATIONAL_AVERAGES: Record<FuelType, number> = {
  E10: 139.9, // Unleaded Petrol
  E5: 151.9,  // Super Unleaded Petrol
  B7: 144.9,  // Standard Diesel
  SDV: 155.9, // Premium Diesel
};

export const FUEL_LABELS: Record<FuelType, { short: string; full: string; code: string }> = {
  E10: { short: 'Unleaded', full: 'Unleaded (E10)', code: 'E10' },
  E5: { short: 'Super Unleaded', full: 'Super Unleaded (E5)', code: 'E5' },
  B7: { short: 'Diesel', full: 'Standard Diesel (B7)', code: 'B7' },
  SDV: { short: 'Super Diesel', full: 'Super Diesel (SDV)', code: 'SDV' },
};

/**
 * Returns all fuel stations loaded from the normalized CMA dataset
 */
export function getAllStations(): FuelStation[] {
  return (stationsData.stations as FuelStation[]) || [];
}

/**
 * Returns dataset metadata info
 */
export function getDatasetMeta() {
  return {
    last_updated: stationsData.last_updated,
    total_stations: stationsData.total_stations,
    source: stationsData.source,
  };
}

/**
 * Calculates 50-Litre Tank Fill Cost in Pounds (£)
 */
export function calculateTankCost(pricePerLitrePence: number, litres = 50): number {
  return (litres * pricePerLitrePence) / 100;
}

/**
 * Calculates estimated savings on a 50-Litre fill compared to the UK National Average
 */
export function calculateFillSavings(
  pricePerLitrePence: number,
  fuelType: FuelType = 'E10',
  litres = 50
): number {
  const nationalAvg = UK_NATIONAL_AVERAGES[fuelType];
  const diff = nationalAvg - pricePerLitrePence;
  if (diff <= 0) return 0;
  return (litres * diff) / 100;
}

/**
 * Filters and sorts stations based on search query, fuel type, brand, and sort order
 */
export function filterStations({
  query = '',
  fuelType = 'E10',
  brand = 'All Brands',
  sortBy = 'cheapest',
  userCoords = null,
}: {
  query?: string;
  fuelType?: FuelType;
  brand?: string;
  sortBy?: SortOption;
  userCoords?: { lat: number; lng: number } | null;
}): { stations: FuelStation[]; cheapestId: string | null } {
  let list = getAllStations();

  // Determine reference coordinate for distance sorting
  let refCoords = userCoords;

  const cleanQuery = query.trim().toUpperCase();

  // If search query is supplied, check if it matches a known city or postcode district
  if (cleanQuery) {
    const queryLower = cleanQuery.toLowerCase();

    // Check UK cities match
    if (UK_CITIES[queryLower]) {
      refCoords = {
        lat: UK_CITIES[queryLower].lat,
        lng: UK_CITIES[queryLower].lng,
      };
    } else if (POSTCODE_DISTRICT_COORDS[cleanQuery]) {
      refCoords = POSTCODE_DISTRICT_COORDS[cleanQuery];
    } else {
      // Check prefix of postcode (e.g., M1 from M1 4BT)
      const districtMatch = cleanQuery.split(' ')[0];
      if (POSTCODE_DISTRICT_COORDS[districtMatch]) {
        refCoords = POSTCODE_DISTRICT_COORDS[districtMatch];
      }
    }

    // Filter stations matching query in name, address, postcode, city, or district
    list = list.filter((s) => {
      const matchText = `${s.name} ${s.brand} ${s.address} ${s.postcode} ${s.city} ${s.district}`.toUpperCase();
      return matchText.includes(cleanQuery);
    });
  }

  // Filter by brand
  if (brand && brand !== 'All Brands') {
    list = list.filter((s) => s.brand.toLowerCase() === brand.toLowerCase());
  }

  // Only keep stations that provide a price for the selected fuel type
  list = list.filter((s) => s.prices[fuelType] !== null && s.prices[fuelType]! > 0);

  // Compute distance for each station if reference coordinates exist
  if (refCoords) {
    list = list.map((s) => ({
      ...s,
      distance: calculateDistanceMiles(
        refCoords!.lat,
        refCoords!.lng,
        s.location.latitude,
        s.location.longitude
      ),
    }));
  }

  // Sort stations
  list.sort((a, b) => {
    const priceA = a.prices[fuelType] ?? 9999;
    const priceB = b.prices[fuelType] ?? 9999;

    if (sortBy === 'distance' && a.distance !== undefined && b.distance !== undefined) {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return priceA - priceB;
    }

    // Default to cheapest price
    if (priceA !== priceB) {
      return priceA - priceB;
    }
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return 0;
  });

  // Identify cheapest station in this specific filtered set
  const cheapestId = list.length > 0 ? list[0].site_id : null;

  return { stations: list, cheapestId };
}

/**
 * Get distinct list of all brands present in data
 */
export function getAllBrands(): string[] {
  const stations = getAllStations();
  const brands = new Set<string>();
  for (const s of stations) {
    if (s.brand) brands.add(s.brand);
  }
  return ['All Brands', ...Array.from(brands).sort()];
}

/**
 * Returns high-level stats for a given city or postcode district
 */
export function getLocalStats(stations: FuelStation[]) {
  const e10Prices = stations
    .map((s) => s.prices.E10)
    .filter((p): p is number => p !== null && p > 0);
  const b7Prices = stations
    .map((s) => s.prices.B7)
    .filter((p): p is number => p !== null && p > 0);
  const e5Prices = stations
    .map((s) => s.prices.E5)
    .filter((p): p is number => p !== null && p > 0);

  const minE10 = e10Prices.length ? Math.min(...e10Prices) : null;
  const avgE10 = e10Prices.length
    ? +(e10Prices.reduce((a, b) => a + b, 0) / e10Prices.length).toFixed(1)
    : null;

  const minB7 = b7Prices.length ? Math.min(...b7Prices) : null;
  const avgB7 = b7Prices.length
    ? +(b7Prices.reduce((a, b) => a + b, 0) / b7Prices.length).toFixed(1)
    : null;

  const minE5 = e5Prices.length ? Math.min(...e5Prices) : null;

  return {
    count: stations.length,
    cheapestE10: minE10,
    averageE10: avgE10,
    cheapestB7: minB7,
    averageB7: avgB7,
    cheapestE5: minE5,
  };
}

/**
 * Aggregates summary statistics for top UK cities for programmatic SEO
 */
export function getCitySummaries(): CitySummary[] {
  const allStations = getAllStations();
  const results: CitySummary[] = [];

  for (const [slug, cityInfo] of Object.entries(UK_CITIES)) {
    const cityStations = allStations.filter(
      (s) =>
        s.city.toLowerCase() === cityInfo.name.toLowerCase() ||
        s.address.toLowerCase().includes(cityInfo.name.toLowerCase())
    );

    const stats = getLocalStats(cityStations);

    results.push({
      name: cityInfo.name,
      slug: slug,
      stationCount: cityStations.length,
      cheapestE10: stats.cheapestE10,
      cheapestB7: stats.cheapestB7,
      averageE10: stats.averageE10,
      averageB7: stats.averageB7,
    });
  }

  return results;
}

/**
 * Returns distinct postcode districts from the dataset
 */
export function getAllPostcodeDistricts(): string[] {
  const allStations = getAllStations();
  const districts = new Set<string>();

  for (const s of allStations) {
    if (s.district && s.district.length >= 2) {
      districts.add(s.district.toUpperCase());
    }
  }

  return Array.from(districts).sort();
}
