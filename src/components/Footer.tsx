import React from 'react';
import Link from 'next/link';
import { Fuel, ShieldCheck, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#F8F9FA] text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] text-xs py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & CMA Attribution */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF6B00] flex items-center justify-center text-white">
                <Fuel className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-white dark:text-white light:text-[#111111]">
                FuelRadar<span className="text-[#FF6B00]">UK</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed">
              FuelRadarUK aggregates real-time fuel prices from participating UK retailers under the
              Competition and Markets Authority (CMA) Temporary Open Data Scheme. Helping UK drivers and businesses find cheaper petrol and diesel near them.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Compliant with UK CMA Open Data Standards</span>
            </div>
          </div>

          {/* Col 2: Major UK Cities */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white dark:text-white light:text-[#111111]">
              Fuel Prices by City
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/city/london" className="hover:text-[#FF6B00] transition-colors">
                  Cheapest Petrol in London
                </Link>
              </li>
              <li>
                <Link href="/city/manchester" className="hover:text-[#FF6B00] transition-colors">
                  Cheapest Petrol in Manchester
                </Link>
              </li>
              <li>
                <Link href="/city/birmingham" className="hover:text-[#FF6B00] transition-colors">
                  Cheapest Petrol in Birmingham
                </Link>
              </li>
              <li>
                <Link href="/city/leeds" className="hover:text-[#FF6B00] transition-colors">
                  Cheapest Petrol in Leeds
                </Link>
              </li>
              <li>
                <Link href="/city/glasgow" className="hover:text-[#FF6B00] transition-colors">
                  Cheapest Petrol in Glasgow
                </Link>
              </li>
              <li>
                <Link href="/city/edinburgh" className="hover:text-[#FF6B00] transition-colors">
                  Cheapest Petrol in Edinburgh
                </Link>
              </li>
              <li>
                <Link href="/city/bristol" className="hover:text-[#FF6B00] transition-colors">
                  Cheapest Petrol in Bristol
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Fuel Types & Tools */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white dark:text-white light:text-[#111111]">
              Fuel Types & Guides
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="text-white dark:text-white light:text-[#111111] font-medium">Unleaded (E10):</span> Standard UK petrol with up to 10% bioethanol
              </li>
              <li>
                <span className="text-white dark:text-white light:text-[#111111] font-medium">Super Unleaded (E5):</span> Premium 97+ RON for high performance
              </li>
              <li>
                <span className="text-white dark:text-white light:text-[#111111] font-medium">Standard Diesel (B7):</span> Standard UK road diesel with up to 7% biodiesel
              </li>
              <li>
                <span className="text-white dark:text-white light:text-[#111111] font-medium">Super Diesel (SDV):</span> Premium additive-enhanced diesel
              </li>
              <li>
                <span className="text-white dark:text-white light:text-[#111111] font-medium">Tank Fill Calculator:</span> 50-litre fill estimates & savings
              </li>
            </ul>
          </div>

          {/* Col 4: Top Postcode Districts */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white dark:text-white light:text-[#111111]">
              Popular Postcodes
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {['SW1A', 'W14', 'E14', 'M1', 'M11', 'B1', 'B5', 'LS1', 'G1', 'EH1', 'BS1', 'L1', 'CF10', 'NE1', 'S1'].map(
                (district) => (
                  <Link
                    key={district}
                    href={`/postcode/${district.toLowerCase()}`}
                    className="px-2 py-1 rounded bg-[#161616] dark:bg-[#161616] light:bg-[#E5E7EB] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#D1D5DB] text-[11px] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors"
                  >
                    {district}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} FuelRadarUK. All rights reserved. Fuel price data is sourced from voluntary and mandatory UK retailer Open Data feeds published under the CMA scheme.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white dark:hover:text-white light:hover:text-[#111111]">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-white dark:hover:text-white light:hover:text-[#111111]">Terms of Use</span>
            <span>•</span>
            <span className="hover:text-white dark:hover:text-white light:hover:text-[#111111]">CMA Open Data API</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
