import React from 'react';
import { FuelStation } from '@/types/fuel';
import { getLocalStats, calculateTankCost, getDatasetMeta } from '@/lib/data';
import { Fuel, TrendingDown, Gauge, MapPin } from 'lucide-react';

interface LocalStatsBoxProps {
  locationName: string;
  stations: FuelStation[];
}

export default function LocalStatsBox({ locationName, stations }: LocalStatsBoxProps) {
  const stats = getLocalStats(stations);
  const { isLiveSource } = getDatasetMeta();

  const tankCostE10 = stats.cheapestE10 ? calculateTankCost(stats.cheapestE10, 50).toFixed(2) : null;
  const tankCostB7 = stats.cheapestB7 ? calculateTankCost(stats.cheapestB7, 50).toFixed(2) : null;

  return (
    <div className="w-full rounded-2xl bg-[#161616] dark:bg-[#161616] light:bg-[#FFFFFF] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/15 flex items-center justify-center text-[#FF6B00]">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white dark:text-white light:text-[#111111]">
              Fuel Benchmark • {locationName}
            </h3>
            <p className="text-[11px] text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280]">
              Prices across {stats.count} stations in our dataset
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 light:text-emerald-600 text-xs font-semibold">
          <span className={`w-1.5 h-1.5 rounded-full ${isLiveSource ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          {isLiveSource ? 'Live data' : 'Snapshot data'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
        {/* Cheapest Unleaded (E10) */}
        <div className="p-3.5 rounded-xl bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#F9FAFB] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB]">
          <div className="text-[11px] font-semibold text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] uppercase tracking-wider">
            Cheapest Unleaded (E10)
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#FF6B00]">
              {stats.cheapestE10 ? `${stats.cheapestE10}` : 'N/A'}
            </span>
            {stats.cheapestE10 && <span className="text-sm font-bold text-[#FF6B00]">p/L</span>}
          </div>
          {tankCostE10 && (
            <div className="text-[11px] text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] mt-1">
              50L Fill: <span className="font-semibold text-white dark:text-white light:text-[#111111]">£{tankCostE10}</span>
            </div>
          )}
        </div>

        {/* Local Average Unleaded */}
        <div className="p-3.5 rounded-xl bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#F9FAFB] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB]">
          <div className="text-[11px] font-semibold text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] uppercase tracking-wider">
            Average Unleaded (E10)
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-white dark:text-white light:text-[#111111]">
              {stats.averageE10 ? `${stats.averageE10}` : 'N/A'}
            </span>
            {stats.averageE10 && <span className="text-sm font-bold text-[#A3A3A3]">p/L</span>}
          </div>
          <div className="text-[11px] text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] mt-1">
            Local market mean
          </div>
        </div>

        {/* Cheapest Diesel (B7) */}
        <div className="p-3.5 rounded-xl bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#F9FAFB] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB]">
          <div className="text-[11px] font-semibold text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] uppercase tracking-wider">
            Cheapest Diesel (B7)
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#FF6B00]">
              {stats.cheapestB7 ? `${stats.cheapestB7}` : 'N/A'}
            </span>
            {stats.cheapestB7 && <span className="text-sm font-bold text-[#FF6B00]">p/L</span>}
          </div>
          {tankCostB7 && (
            <div className="text-[11px] text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] mt-1">
              50L Fill: <span className="font-semibold text-white dark:text-white light:text-[#111111]">£{tankCostB7}</span>
            </div>
          )}
        </div>

        {/* Local Average Diesel */}
        <div className="p-3.5 rounded-xl bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#F9FAFB] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB]">
          <div className="text-[11px] font-semibold text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] uppercase tracking-wider">
            Average Diesel (B7)
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-white dark:text-white light:text-[#111111]">
              {stats.averageB7 ? `${stats.averageB7}` : 'N/A'}
            </span>
            {stats.averageB7 && <span className="text-sm font-bold text-[#A3A3A3]">p/L</span>}
          </div>
          <div className="text-[11px] text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] mt-1">
            Local market mean
          </div>
        </div>
      </div>
    </div>
  );
}
