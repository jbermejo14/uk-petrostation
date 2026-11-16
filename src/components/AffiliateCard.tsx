'use client';

import React from 'react';
import { ShieldCheck, ArrowRight, Zap, Car, Fuel } from 'lucide-react';

interface AffiliateCardProps {
  cityOrDistrict?: string;
}

export default function AffiliateCard({ cityOrDistrict }: AffiliateCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#FF6B00] bg-gradient-to-br from-[#161616] via-[#1A1412] to-[#161616] dark:from-[#161616] dark:via-[#1A1412] dark:to-[#161616] light:from-[#FFF9F5] light:via-[#FFF3EB] light:to-[#FFFFFF] p-5 sm:p-6 shadow-xl transition-all">
      {/* Decorative orange background glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#FF6B00]/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF6B00]/15 text-[#FF6B00] text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Driver Savings Hub {cityOrDistrict ? `• ${cityOrDistrict}` : ''}</span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111] leading-snug">
            Save more on every mile: Compare UK Car Insurance quotes or get a Fuel Card for your business
          </h3>

          <p className="text-xs sm:text-sm text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#4B5563] leading-relaxed">
            Finding the cheapest fuel pump is just step one. UK motorists save an average of £319/year by switching car insurance providers and up to 10p/litre on corporate fuel cards.
          </p>
        </div>

        {/* Dual Orange CTA Buttons */}
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 w-full md:w-auto shrink-0">
          <a
            href="https://www.confused.com/car-insurance"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#FF6B00] hover:bg-[#E05E00] shadow-lg shadow-[#FF6B00]/25 transition-transform hover:-translate-y-0.5 text-center"
          >
            <Car className="w-4 h-4" />
            <span>Compare Car Insurance</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href="https://tfl.gov.uk/modes/driving/check-your-vehicle/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-[#FF6B00] bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 border border-[#FF6B00]/40 transition-transform hover:-translate-y-0.5 text-center"
          >
            <Fuel className="w-4 h-4" />
            <span>Check ULEZ / Clean Air Zones</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
