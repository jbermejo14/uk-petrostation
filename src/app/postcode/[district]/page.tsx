import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllStations, getAllPostcodeDistricts } from '@/lib/data';
import { POSTCODE_DISTRICT_COORDS } from '@/lib/geo';
import StationList from '@/components/StationList';
import Breadcrumbs from '@/components/Breadcrumbs';
import LocalStatsBox from '@/components/LocalStatsBox';
import FaqSection from '@/components/FaqSection';
import { MapPin, Fuel } from 'lucide-react';

interface PostcodePageProps {
  params: {
    district: string;
  };
}

export function generateStaticParams() {
  const districts = getAllPostcodeDistricts();
  // Filter reasonable districts
  return districts.slice(0, 40).map((d) => ({
    district: d.toLowerCase(),
  }));
}

export function generateMetadata({ params }: PostcodePageProps): Metadata {
  const districtUpper = params.district.toUpperCase();
  const districtInfo = POSTCODE_DISTRICT_COORDS[districtUpper];
  const areaName = districtInfo ? `${districtUpper} (${districtInfo.city})` : districtUpper;

  const title = `Cheapest Petrol & Diesel in ${areaName} Today | UK FuelRadar`;
  const description = `Live petrol and diesel prices in postcode area ${districtUpper}. Compare real-time prices for Unleaded (E10) and Diesel (B7) to find the cheapest pump.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://fuelradar.co.uk/postcode/${params.district.toLowerCase()}`,
    },
    alternates: {
      canonical: `https://fuelradar.co.uk/postcode/${params.district.toLowerCase()}`,
    },
  };
}

export default function PostcodePage({ params }: PostcodePageProps) {
  const districtUpper = params.district.toUpperCase();
  const districtInfo = POSTCODE_DISTRICT_COORDS[districtUpper];

  const allStations = getAllStations();
  const districtStations = allStations.filter(
    (s) =>
      s.district.toUpperCase() === districtUpper ||
      s.postcode.toUpperCase().startsWith(districtUpper)
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Postcodes', href: '/' },
          { label: districtUpper },
        ]}
      />

      {/* Header Banner */}
      <section className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6B00]/15 text-[#FF6B00] text-xs font-bold uppercase tracking-wider">
          <MapPin className="w-3.5 h-3.5" />
          <span>UK Postcode District {districtUpper} {districtInfo ? `• ${districtInfo.city}` : ''}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white dark:text-white light:text-[#111111]">
          Cheapest Petrol & Diesel Prices in <span className="text-[#FF6B00]">{districtUpper}</span> Today
        </h1>

        <p className="text-xs sm:text-sm text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] max-w-3xl leading-relaxed">
          Real-time UK fuel price comparison for postcode district {districtUpper}. Check the lowest rates for Unleaded (E10), Super (E5), and Diesel (B7) within your immediate area.
        </p>
      </section>

      {/* Local Statistics Benchmark Box */}
      <section>
        <LocalStatsBox
          locationName={`Postcode ${districtUpper}`}
          stations={districtStations.length > 0 ? districtStations : allStations.slice(0, 10)}
        />
      </section>

      {/* Pre-filtered Station List & Map */}
      <section>
        <StationList
          defaultQuery={districtUpper}
          cityOrDistrictName={districtUpper}
        />
      </section>

      {/* Local FAQ */}
      <section>
        <FaqSection locationName={`Postcode ${districtUpper}`} />
      </section>
    </div>
  );
}
