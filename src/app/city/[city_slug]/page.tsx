import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllStations, getLocalStats } from '@/lib/data';
import { UK_CITIES } from '@/lib/geo';
import StationList from '@/components/StationList';
import Breadcrumbs from '@/components/Breadcrumbs';
import LocalStatsBox from '@/components/LocalStatsBox';
import FaqSection from '@/components/FaqSection';
import { MapPin, Fuel, ShieldCheck, ArrowRight } from 'lucide-react';

interface CityPageProps {
  params: {
    city_slug: string;
  };
}

export function generateStaticParams() {
  return Object.keys(UK_CITIES).map((slug) => ({
    city_slug: slug,
  }));
}

export function generateMetadata({ params }: CityPageProps): Metadata {
  const cityInfo = UK_CITIES[params.city_slug.toLowerCase()];
  if (!cityInfo) {
    return {
      title: 'City Fuel Prices | FuelRadarUK',
    };
  }

  const title = `Cheapest Petrol & Diesel in ${cityInfo.name}`;
  const description = `Find the cheapest petrol (E10, E5) and diesel (B7) in ${cityInfo.name}, ${cityInfo.county}. Prices from a snapshot of retailer feeds, mainly Asda and Applegreen.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://fuelradar.co.uk/city/${cityInfo.slug}`,
    },
    alternates: {
      canonical: `https://fuelradar.co.uk/city/${cityInfo.slug}`,
    },
  };
}

export default function CityPage({ params }: CityPageProps) {
  const cityKey = params.city_slug.toLowerCase();
  const cityInfo = UK_CITIES[cityKey];

  if (!cityInfo) {
    notFound();
  }

  const allStations = getAllStations();
  const cityStations = allStations.filter(
    (s) => s.city.toLowerCase() === cityInfo.name.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs
        items={[
          { label: 'UK Cities', href: '/' },
          { label: cityInfo.name },
        ]}
      />

      {/* Header Banner */}
      <section className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6B00]/15 text-[#FF6B00] text-xs font-bold uppercase tracking-wider">
          <MapPin className="w-3.5 h-3.5" />
          <span>{cityInfo.name}, {cityInfo.county}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white dark:text-white light:text-[#111111]">
          Cheapest Petrol & Diesel Prices in <span className="text-[#FF6B00]">{cityInfo.name}</span>
        </h1>

        <p className="text-xs sm:text-sm text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] max-w-3xl leading-relaxed">
          Compare pump prices across {cityStations.length} fuel stations in our dataset in {cityInfo.name}. Find the lowest rate for Unleaded (E10), Super (E5), and Diesel (B7).
        </p>
      </section>

      {/* Local Summary Benchmark Box */}
      <section>
        <LocalStatsBox locationName={cityInfo.name} stations={cityStations} />
      </section>

      {/* Pre-filtered Station List & Interactive Map */}
      <section>
        <StationList
          defaultQuery={cityInfo.name}
          cityOrDistrictName={cityInfo.name}
        />
      </section>

      {/* Local FAQ */}
      <section>
        <FaqSection locationName={cityInfo.name} />
      </section>
    </div>
  );
}
