'use client';

import React from 'react';

interface AdSlotProps {
  format?: 'banner' | 'in-feed' | 'rectangle';
  className?: string;
}

/**
 * Bloque de anuncio. No se renderiza si no existe NEXT_PUBLIC_ADSENSE_CLIENT,
 * para no mostrar huecos publicitarios sin ID de anuncios.
 */
export default function AdSlot({ format = 'banner', className = '' }: AdSlotProps) {
  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT) return null;

  return (
    <div
      className={`w-full overflow-hidden rounded-xl border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] bg-[#121212] dark:bg-[#121212] light:bg-[#F9FAFB] p-3 text-center transition-colors ${className}`}
      aria-label="Advertisement"
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#9CA3AF] mb-2 px-1">
        <span>Advertisement</span>
        <span className="text-[9px] text-[#737373]">AdSense / Partner</span>
      </div>

      <div
        className={`w-full flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#D1D5DB] bg-[#161616]/50 dark:bg-[#161616]/50 light:bg-[#FFFFFF] ${
          format === 'banner'
            ? 'min-h-[90px] py-3'
            : format === 'in-feed'
            ? 'min-h-[110px] py-4'
            : 'min-h-[250px] py-6'
        }`}
      >
        <span className="text-xs font-semibold text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280]">
          Sponsored Partner Opportunity
        </span>
        <span className="text-[11px] text-[#737373] dark:text-[#737373] light:text-[#9CA3AF] mt-0.5">
          High-Yield UK Motoring, Fleet & EV Energy Offers
        </span>
      </div>
    </div>
  );
}
