/**
 * src/lib/geo.ts
 * Geodetic calculations and UK geographic reference points.
 */

// Earth radius in miles
const EARTH_RADIUS_MILES = 3958.8;

/**
 * Calculates Great-Circle distance between two points in miles using Haversine formula
 */
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_MILES * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Prominent UK cities and towns with coordinates for instant fast lookup
 */
export const UK_CITIES: Record<
  string,
  { name: string; slug: string; lat: number; lng: number; county: string }
> = {
  london: {
    name: 'London',
    slug: 'london',
    lat: 51.5074,
    lng: -0.1278,
    county: 'Greater London',
  },
  manchester: {
    name: 'Manchester',
    slug: 'manchester',
    lat: 53.4808,
    lng: -2.2426,
    county: 'Greater Manchester',
  },
  birmingham: {
    name: 'Birmingham',
    slug: 'birmingham',
    lat: 52.4862,
    lng: -1.8904,
    county: 'West Midlands',
  },
  leeds: {
    name: 'Leeds',
    slug: 'leeds',
    lat: 53.8008,
    lng: -1.5491,
    county: 'West Yorkshire',
  },
  glasgow: {
    name: 'Glasgow',
    slug: 'glasgow',
    lat: 55.8642,
    lng: -4.2518,
    county: 'Lanarkshire',
  },
  edinburgh: {
    name: 'Edinburgh',
    slug: 'edinburgh',
    lat: 55.9533,
    lng: -3.1883,
    county: 'Midlothian',
  },
  bristol: {
    name: 'Bristol',
    slug: 'bristol',
    lat: 51.4545,
    lng: -2.5879,
    county: 'City of Bristol',
  },
  liverpool: {
    name: 'Liverpool',
    slug: 'liverpool',
    lat: 53.4084,
    lng: -2.9916,
    county: 'Merseyside',
  },
  cardiff: {
    name: 'Cardiff',
    slug: 'cardiff',
    lat: 51.4816,
    lng: -3.1791,
    county: 'South Glamorgan',
  },
  newcastle: {
    name: 'Newcastle',
    slug: 'newcastle',
    lat: 54.9783,
    lng: -1.6178,
    county: 'Tyne and Wear',
  },
  sheffield: {
    name: 'Sheffield',
    slug: 'sheffield',
    lat: 53.3811,
    lng: -1.4701,
    county: 'South Yorkshire',
  },
  coventry: {
    name: 'Coventry',
    slug: 'coventry',
    lat: 52.4068,
    lng: -1.5197,
    county: 'West Midlands',
  },
  nottingham: {
    name: 'Nottingham',
    slug: 'nottingham',
    lat: 52.9548,
    lng: -1.1581,
    county: 'Nottinghamshire',
  },
  leicester: {
    name: 'Leicester',
    slug: 'leicester',
    lat: 52.6369,
    lng: -1.1398,
    county: 'Leicestershire',
  },
  southampton: {
    name: 'Southampton',
    slug: 'southampton',
    lat: 50.9097,
    lng: -1.4044,
    county: 'Hampshire',
  },
  belfast: {
    name: 'Belfast',
    slug: 'belfast',
    lat: 54.5973,
    lng: -5.9301,
    county: 'County Antrim',
  },
};

/**
 * Key UK Postcode District references
 */
export const POSTCODE_DISTRICT_COORDS: Record<string, { lat: number; lng: number; city: string }> = {
  // London
  SW1A: { lat: 51.5014, lng: -0.1419, city: 'London' },
  W14: { lat: 51.4952, lng: -0.2031, city: 'London' },
  E14: { lat: 51.5033, lng: -0.0188, city: 'London' },
  SW19: { lat: 51.4214, lng: -0.1983, city: 'London' },
  W6: { lat: 51.4925, lng: -0.2239, city: 'London' },
  W2: { lat: 51.5165, lng: -0.1772, city: 'London' },
  E4: { lat: 51.6247, lng: -0.0051, city: 'London' },
  N12: { lat: 51.6162, lng: -0.1772, city: 'London' },
  // Manchester
  M1: { lat: 53.4774, lng: -2.2346, city: 'Manchester' },
  M11: { lat: 53.4831, lng: -2.2004, city: 'Manchester' },
  M16: { lat: 53.4568, lng: -2.2905, city: 'Manchester' },
  M41: { lat: 53.4682, lng: -2.3387, city: 'Manchester' },
  M5: { lat: 53.4735, lng: -2.2712, city: 'Manchester' },
  // Birmingham
  B1: { lat: 52.4800, lng: -1.9026, city: 'Birmingham' },
  B5: { lat: 52.4641, lng: -1.9082, city: 'Birmingham' },
  B76: { lat: 52.5367, lng: -1.7774, city: 'Birmingham' },
  B10: { lat: 52.4705, lng: -1.8643, city: 'Birmingham' },
  B20: { lat: 52.5113, lng: -1.9024, city: 'Birmingham' },
  // Leeds
  LS1: { lat: 53.7967, lng: -1.5458, city: 'Leeds' },
  LS14: { lat: 53.8062, lng: -1.4886, city: 'Leeds' },
  LS5: { lat: 53.8185, lng: -1.5971, city: 'Leeds' },
  LS2: { lat: 53.8028, lng: -1.5342, city: 'Leeds' },
  // Glasgow
  G1: { lat: 55.8609, lng: -4.2494, city: 'Glasgow' },
  G34: { lat: 55.8679, lng: -4.1189, city: 'Glasgow' },
  G51: { lat: 55.8562, lng: -4.3214, city: 'Glasgow' },
  G13: { lat: 55.8942, lng: -4.3315, city: 'Glasgow' },
  // Edinburgh
  EH1: { lat: 55.9520, lng: -3.1900, city: 'Edinburgh' },
  EH4: { lat: 55.9691, lng: -3.2394, city: 'Edinburgh' },
  EH14: { lat: 55.9279, lng: -3.2483, city: 'Edinburgh' },
  EH15: { lat: 55.9615, lng: -3.1362, city: 'Edinburgh' },
  // Bristol
  BS1: { lat: 51.4545, lng: -2.5979, city: 'Bristol' },
  BS3: { lat: 51.4428, lng: -2.5958, city: 'Bristol' },
  BS5: { lat: 51.4721, lng: -2.5621, city: 'Bristol' },
  BS4: { lat: 51.4326, lng: -2.5492, city: 'Bristol' },
  // Liverpool
  L1: { lat: 53.4042, lng: -2.9839, city: 'Liverpool' },
  L8: { lat: 53.3884, lng: -2.9641, city: 'Liverpool' },
  L15: { lat: 53.3931, lng: -2.9348, city: 'Liverpool' },
  // Sheffield
  S1: { lat: 53.3811, lng: -1.4701, city: 'Sheffield' },
  S8: { lat: 53.3441, lng: -1.4827, city: 'Sheffield' },
  // Newcastle
  NE1: { lat: 54.9738, lng: -1.6132, city: 'Newcastle' },
  NE6: { lat: 54.9782, lng: -1.5794, city: 'Newcastle' },
  NE8: { lat: 54.9621, lng: -1.6187, city: 'Newcastle' },
  // Cardiff
  CF10: { lat: 51.4816, lng: -3.1791, city: 'Cardiff' },
  CF11: { lat: 51.4589, lng: -3.1895, city: 'Cardiff' },
  CF14: { lat: 51.5012, lng: -3.2081, city: 'Cardiff' },
};
