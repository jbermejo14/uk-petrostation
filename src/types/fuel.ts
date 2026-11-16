export interface StationPrice {
  E10: number | null;
  E5: number | null;
  B7: number | null;
  SDV: number | null;
}

export interface StationLocation {
  latitude: number;
  longitude: number;
}

export interface FuelStation {
  site_id: string;
  brand: string;
  name: string;
  address: string;
  postcode: string;
  district: string;
  city: string;
  location: StationLocation;
  prices: StationPrice;
  updated_at?: string;
  distance?: number; // Calculated in miles when user coordinates or search target are provided
}

export type FuelType = 'E10' | 'E5' | 'B7' | 'SDV';

export type SortOption = 'cheapest' | 'distance';

export interface DatasetPayload {
  last_updated: string;
  source: string;
  total_stations: number;
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
