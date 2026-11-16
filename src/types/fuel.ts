export interface StationPrice {
  E10: number | null;
  E5: number | null;
  B7: number | null;
  SDV: number | null;
}

export interface StationPriceTimestamps {
  E10?: string | null;
  E5?: string | null;
  B7?: string | null;
  SDV?: string | null;
}

export interface StationLocation {
  latitude: number;
  longitude: number;
}

export interface FuelStation {
  site_id: string; // Official Fuel Finder node_id
  brand: string;
  name: string;
  address: string;
  postcode: string;
  district: string;
  city: string;
  location: StationLocation;
  prices: StationPrice;
  price_timestamps?: StationPriceTimestamps;
  updated_at: string;
  distance?: number; // Calculated in miles when user coordinates or search target are provided
}

export type FuelType = 'E10' | 'E5' | 'B7' | 'SDV';

export type SortOption = 'cheapest' | 'distance';

export interface NationalAverages {
  E10: number | null;
  E5: number | null;
  B7: number | null;
  SDV: number | null;
}

export interface DiscardedStats {
  missing_id: number;
  invalid_coords: number;
  no_valid_prices: number;
  total_discarded: number;
}

export interface DatasetPayload {
  last_updated: string;
  source: string; // e.g. "Fuel Finder, Open Government Licence v3.0"
  licence: string;
  total_stations: number;
  national_averages: NationalAverages;
  discarded_stats?: DiscardedStats;
  stations: FuelStation[];
}

export interface CitySummary {
  name: string;
  slug: string;
  stationCount: number;
  cheapestE10: number | null;
  cheapestB7: number | null;
  averageE10: number | null;
  averageB7: number | null;
}
