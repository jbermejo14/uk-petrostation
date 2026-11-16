import { MetadataRoute } from 'next';
import { UK_CITIES } from '@/lib/geo';
import { getAllPostcodeDistricts } from '@/lib/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://fuelradar.co.uk';

  // Base home route
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // City routes
  for (const slug of Object.keys(UK_CITIES)) {
    routes.push({
      url: `${baseUrl}/city/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    });
  }

  // Top Postcode districts
  const districts = getAllPostcodeDistricts().slice(0, 50);
  for (const district of districts) {
    routes.push({
      url: `${baseUrl}/postcode/${district.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }

  return routes;
}
