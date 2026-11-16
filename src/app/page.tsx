import React from 'react';
import Link from 'next/link';
import { getAllStations, getDatasetMeta, getNationalAverages } from '@/lib/data';
import StationList from '@/components/StationList';
import FaqSection from '@/components/FaqSection';
import { Fuel, ShieldCheck, MapPin, TrendingDown, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const allStations = getAllStations();
  const meta = getDatasetMeta();
  const nationalAverages = getNationalAverages();

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="text-center max-w-3xl mx-auto space-y-3 pt-2 sm:pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B00]/15 text-[#FF6B00] text-xs font-bold uppercase tracking-wider">
          <Fuel className="w-3.5 h-3.5" />
          <span>{allStations.length} Stations in Our Dataset</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white dark:text-white light:text-[#111111] leading-tight">
          Find the <span className="text-[#FF6B00]">Cheapest UK Fuel</span> Near You Today
        </h1>

        <p className="text-sm sm:text-base text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] leading-relaxed">
          Compare petrol & diesel prices across the stations in our dataset, which currently covers mainly Asda and Applegreen. Source: {meta.source}.
        </p>

        {/* Quick City Navigation Pills */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2">
          <span className="text-xs font-semibold text-[#A3A3A3] mr-1">Quick Select:</span>
          {[
            { name: 'London', slug: 'london' },
            { name: 'Manchester', slug: 'manchester' },
            { name: 'Birmingham', slug: 'birmingham' },
            { name: 'Leeds', slug: 'leeds' },
            { name: 'Glasgow', slug: 'glasgow' },
            { name: 'Edinburgh', slug: 'edinburgh' },
            { name: 'Bristol', slug: 'bristol' },
          ].map((city) => (
            <Link
              key={city.slug}
              href={`/city/${city.slug}`}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#161616] dark:bg-[#161616] light:bg-[#F3F4F6] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors"
            >
              {city.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Average across the stations in our dataset (not a UK-wide average) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#161616] dark:bg-[#161616] light:bg-[#FFFFFF] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB]">
        <div className="col-span-2 sm:col-span-4 text-center text-[11px] text-[#A3A3A3]">
          Average across stations in our dataset
        </div>
        <div className="text-center p-2">
          <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider block">
            Dataset Avg Unleaded (E10)
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111]">
            {nationalAverages.E10 ? `${nationalAverages.E10}p` : 'N/A'}
          </span>
        </div>
        <div className="text-center p-2">
          <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider block">
            Dataset Avg Super (E5)
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111]">
            {nationalAverages.E5 ? `${nationalAverages.E5}p` : 'N/A'}
          </span>
        </div>
        <div className="text-center p-2">
          <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider block">
            Dataset Avg Diesel (B7)
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111]">
            {nationalAverages.B7 ? `${nationalAverages.B7}p` : 'N/A'}
          </span>
        </div>
        <div className="text-center p-2">
          <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider block">
            Dataset Avg Super Diesel (SDV)
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111]">
            {nationalAverages.SDV ? `${nationalAverages.SDV}p` : 'N/A'}
          </span>
        </div>
      </section>

      {/* Main Interactive Station Finder & Split-Screen Map */}
      <section>
        <StationList />
      </section>

      {/* SEO Internal Linking: UK Regional Hubs */}
      <section className="rounded-2xl bg-[#161616] dark:bg-[#161616] light:bg-[#FFFFFF] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] p-6 space-y-4">
        <h2 className="text-lg font-bold text-white dark:text-white light:text-[#111111]">
          Explore UK Fuel Prices by Region & City
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
          {[
            { name: 'London Fuel Prices', slug: 'london' },
            { name: 'Manchester Fuel Prices', slug: 'manchester' },
            { name: 'Birmingham Fuel Prices', slug: 'birmingham' },
            { name: 'Leeds Fuel Prices', slug: 'leeds' },
            { name: 'Glasgow Fuel Prices', slug: 'glasgow' },
            { name: 'Edinburgh Fuel Prices', slug: 'edinburgh' },
            { name: 'Bristol Fuel Prices', slug: 'bristol' },
            { name: 'Liverpool Fuel Prices', slug: 'liverpool' },
            { name: 'Newcastle Fuel Prices', slug: 'newcastle' },
            { name: 'Sheffield Fuel Prices', slug: 'sheffield' },
            { name: 'Cardiff Fuel Prices', slug: 'cardiff' },
            { name: 'Coventry Fuel Prices', slug: 'coventry' },
          ].map((item) => (
            <Link
              key={item.slug}
              href={`/city/${item.slug}`}
              className="p-2.5 rounded-lg bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#F9FAFB] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors flex items-center justify-between group"
            >
              <span>{item.name}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ Section with JSON-LD FAQPage */}
      <FaqSection />
    </div>
  );
}
