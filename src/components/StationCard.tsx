'use client';

import React from 'react';
import { FuelStation, FuelType } from '@/types/fuel';
import { calculateTankCost, calculateFillSavings, FUEL_LABELS } from '@/lib/data';
import { Navigation, MapPin, Zap, Clock, ExternalLink, CheckCircle } from 'lucide-react';

interface StationCardProps {
  station: FuelStation;
  selectedFuel: FuelType;
  isCheapest: boolean;
  isSelected?: boolean;
  onSelect?: (station: FuelStation) => void;
}

// Brand visual color badges
const BRAND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Asda: { bg: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Tesco: { bg: 'bg-blue-950/40 text-blue-400 border-blue-500/40', text: 'text-blue-400', border: 'border-blue-500/30' },
  "Sainsbury's": { bg: 'bg-amber-950/40 text-amber-400 border-amber-500/40', text: 'text-amber-400', border: 'border-amber-500/30' },
  Morrisons: { bg: 'bg-yellow-950/40 text-yellow-400 border-yellow-500/40', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  BP: { bg: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  Shell: { bg: 'bg-yellow-950/40 text-yellow-300 border-yellow-500/40', text: 'text-yellow-300', border: 'border-yellow-500/30' },
  Esso: { bg: 'bg-red-950/40 text-red-400 border-red-500/40', text: 'text-red-400', border: 'border-red-500/30' },
  Costco: { bg: 'bg-indigo-950/40 text-indigo-400 border-indigo-500/40', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  Texaco: { bg: 'bg-red-950/40 text-red-400 border-red-500/40', text: 'text-red-400', border: 'border-red-500/30' },
  Jet: { bg: 'bg-yellow-950/40 text-yellow-400 border-yellow-500/40', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  Applegreen: { bg: 'bg-green-950/40 text-green-400 border-green-500/40', text: 'text-green-400', border: 'border-green-500/30' },
};

export default function StationCard({
  station,
  selectedFuel,
  isCheapest,
  isSelected = false,
  onSelect,
}: StationCardProps) {
  const currentPrice = station.prices[selectedFuel];
  const tankCost = currentPrice ? calculateTankCost(currentPrice, 50) : null;
  const savings = currentPrice ? calculateFillSavings(currentPrice, selectedFuel, 50) : 0;

  const brandStyle = BRAND_COLORS[station.brand] || {
    bg: 'bg-zinc-800/50 text-zinc-300 border-zinc-700',
    text: 'text-zinc-300',
    border: 'border-zinc-700',
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.location.latitude},${station.location.longitude}`;

  return (
    <div
      onClick={() => onSelect?.(station)}
      className={`relative group rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-5 ${
        isCheapest
          ? 'border-[#FF6B00] bg-[#161616] dark:bg-[#161616] light:bg-[#FFFFFF] shadow-lg shadow-[#FF6B00]/10 ring-1 ring-[#FF6B00]'
          : isSelected
          ? 'border-[#FF6B00] bg-[#1A1A1A] dark:bg-[#1A1A1A] light:bg-[#FFF7F0] shadow-md'
          : 'border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] bg-[#161616] dark:bg-[#161616] light:bg-[#FFFFFF] hover:border-[#FF6B00]/60 hover:bg-[#1A1A1A] dark:hover:bg-[#1A1A1A] light:hover:bg-[#F9FAFB]'
      }`}
    >
      {/* Cheapest Nearby Badge Banner */}
      {isCheapest && (
        <div className="absolute top-0 right-0 bg-[#FF6B00] text-white px-3 py-1 rounded-bl-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md">
          <Zap className="w-3 h-3 fill-current" />
          <span>Cheapest Nearby</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Side: Brand, Station Name, Address & Distance */}
        <div className="space-y-1.5 flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${brandStyle.bg} ${brandStyle.border}`}
            >
              {station.brand}
            </span>

            {station.distance !== undefined && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-md">
                <Navigation className="w-3 h-3 rotate-45" />
                {station.distance} miles away
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111] truncate group-hover:text-[#FF6B00] transition-colors">
            {station.name}
          </h3>

          <div className="flex items-center gap-1 text-xs text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280]">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#737373]" />
            <span className="truncate">{station.address}</span>
            <span className="font-semibold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111] shrink-0 ml-1">
              ({station.postcode})
            </span>
          </div>
        </div>

        {/* Right Side: Large Price Display & Tank Cost */}
        <div className="flex flex-row sm:flex-col items-baseline sm:items-end justify-between w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB]">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#FF6B00]">
              {currentPrice ? `${currentPrice}` : '--'}
            </span>
            <span className="text-lg font-bold text-[#FF6B00]">p</span>
            <span className="text-xs text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] ml-0.5">
              / litre
            </span>
          </div>

          {tankCost !== null && (
            <div className="text-right mt-1">
              <div className="text-xs font-semibold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111]">
                50L Fill: <span className="font-bold text-[#FF6B00]">£{tankCost.toFixed(2)}</span>
              </div>
              {savings > 0 && (
                <div className="text-[11px] font-semibold text-emerald-400 light:text-emerald-600">
                  Save £{savings.toFixed(2)} vs UK avg
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Available Fuel Types Pills */}
      <div className="mt-4 pt-3 border-t border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['E10', 'E5', 'B7', 'SDV'] as FuelType[]).map((ft) => {
            const price = station.prices[ft];
            const isActive = ft === selectedFuel;
            return (
              <span
                key={ft}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'bg-[#FF6B00] text-white font-bold'
                    : price
                    ? 'bg-[#222222] dark:bg-[#222222] light:bg-[#F3F4F6] text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#4B5563]'
                    : 'bg-transparent text-[#525252] line-through'
                }`}
              >
                {ft}: {price ? `${price}p` : 'N/A'}
              </span>
            );
          })}
        </div>

        {/* Action: Google Maps Directions */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#222222] dark:bg-[#222222] light:bg-[#F3F4F6] hover:bg-[#FF6B00] hover:text-white text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111] transition-all ml-auto"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Get Directions</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      </div>
    </div>
  );
}
