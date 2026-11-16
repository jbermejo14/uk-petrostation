'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { FuelStation, FuelType, SortOption } from '@/types/fuel';
import { filterStations, getAllBrands, getDatasetMeta, FUEL_LABELS, calculateTankCost } from '@/lib/data';
import StationCard from './StationCard';
import AffiliateCard from './AffiliateCard';
import AdSlot from './AdSlot';
import {
  Search,
  Crosshair,
  Filter,
  ArrowUpDown,
  MapPin,
  ListFilter,
  Map,
  List,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Dynamically import FuelMap with SSR disabled to prevent Leaflet window reference errors
const FuelMap = dynamic(() => import('./FuelMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] rounded-2xl bg-[#161616] dark:bg-[#161616] light:bg-[#F3F4F6] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] flex flex-col items-center justify-center p-8 text-center animate-pulse">
      <div className="w-10 h-10 rounded-full border-4 border-[#FF6B00] border-t-transparent animate-spin mb-3" />
      <span className="text-sm font-semibold text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280]">
        Loading Interactive FuelRadar Map...
      </span>
    </div>
  ),
});

interface StationListProps {
  initialStations?: FuelStation[];
  defaultQuery?: string;
  defaultFuel?: FuelType;
  cityOrDistrictName?: string;
}

const ITEMS_PER_PAGE = 30;

export default function StationList({
  initialStations,
  defaultQuery = '',
  defaultFuel = 'E10',
  cityOrDistrictName,
}: StationListProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [fuelType, setFuelType] = useState<FuelType>(defaultFuel);
  const [brand, setBrand] = useState('All Brands');
  const [sortBy, setSortBy] = useState<SortOption>('cheapest');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedStation, setSelectedStation] = useState<FuelStation | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  const allBrands = useMemo(() => getAllBrands(), []);

  // Filter and sort computation
  const { stations: filteredStations, cheapestId } = useMemo(() => {
    return filterStations({
      query,
      fuelType,
      brand,
      sortBy,
      userCoords,
    });
  }, [query, fuelType, brand, sortBy, userCoords]);

  // Handle GPS location request
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setSortBy('distance');
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        alert('Could not access your location. Please enter your postcode or town manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Pagination calculation
  const totalPages = Math.ceil(filteredStations.length / ITEMS_PER_PAGE) || 1;
  const paginatedStations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStations, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#161616] dark:bg-[#161616] light:bg-[#FFFFFF] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] shadow-lg space-y-4">
        {/* Main Search Input + Near Me GPS Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#9CA3AF]" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Enter UK Postcode (e.g. SW1A, M1, B1) or Town / City..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#F9FAFB] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] text-sm text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111] placeholder-[#737373] dark:placeholder-[#737373] light:placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#A3A3A3] hover:text-[#FF6B00]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Near Me GPS Button */}
          <button
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shadow-md ${
              userCoords
                ? 'bg-emerald-500 text-white'
                : 'bg-[#FF6B00] hover:bg-[#E05E00] text-white'
            }`}
          >
            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>
              {isLocating
                ? 'Locating...'
                : userCoords
                ? 'Using GPS Location'
                : 'Use My Location'}
            </span>
          </button>
        </div>

        {/* Secondary Filter Row: Fuel Types & Brand Selector */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-3 border-t border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB]">
          {/* Fuel Type Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(['E10', 'E5', 'B7', 'SDV'] as FuelType[]).map((type) => {
              const active = fuelType === type;
              return (
                <button
                  key={type}
                  onClick={() => {
                    setFuelType(type);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/30'
                      : 'bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#F3F4F6] text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#4B5563] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] hover:border-[#FF6B00]'
                  }`}
                >
                  <span>{FUEL_LABELS[type].full}</span>
                </button>
              );
            })}
          </div>

          {/* Brand & Sort Dropdowns */}
          <div className="flex items-center gap-2.5">
            {/* Brand Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#F9FAFB] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] text-xs font-semibold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111] focus:outline-none focus:border-[#FF6B00]"
              >
                {allBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A3A3A3] pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#F9FAFB] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] text-xs font-semibold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111] focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="cheapest">Sort: Cheapest Price</option>
                <option value="distance">Sort: Nearest Distance</option>
              </select>
              <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A3A3A3] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* CLS-safe Reserved AdSlot below Search */}
      <AdSlot format="banner" className="my-2" />

      {/* Mobile Split Screen Switcher: [List View] / [Map View] */}
      <div className="lg:hidden flex items-center p-1 rounded-xl bg-[#161616] dark:bg-[#161616] light:bg-[#E5E7EB] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#D1D5DB]">
        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            mobileView === 'list'
              ? 'bg-[#FF6B00] text-white shadow-md'
              : 'text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#4B5563]'
          }`}
        >
          <List className="w-4 h-4" />
          <span>Station List ({filteredStations.length})</span>
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            mobileView === 'map'
              ? 'bg-[#FF6B00] text-white shadow-md'
              : 'text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#4B5563]'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Interactive Map</span>
        </button>
      </div>

      {/* Main Content Area: Desktop Split Screen (Left: Station Cards, Right: Sticky Leaflet Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Station Cards List (Paginated, 30 per page) */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            mobileView === 'map' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Results Summary Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 px-1">
            <span className="text-xs font-semibold text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280]">
              Showing <span className="text-white dark:text-white light:text-[#111111] font-bold">{filteredStations.length}</span> stations
              {cityOrDistrictName ? ` in ${cityOrDistrictName}` : ''} • Sorted by{' '}
              {sortBy === 'cheapest' ? 'Cheapest Price' : 'Distance'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#888888]">{getDatasetMeta().source}</span>
              <span className="text-xs text-[#FF6B00] font-bold">
                Fuel: {FUEL_LABELS[fuelType].short}
              </span>
            </div>
          </div>

          {/* Station Cards Loop */}
          {paginatedStations.length > 0 ? (
            <div className="space-y-3.5">
              {paginatedStations.map((station, index) => (
                <React.Fragment key={station.site_id}>
                  <StationCard
                    station={station}
                    selectedFuel={fuelType}
                    isCheapest={station.site_id === cheapestId}
                    isSelected={selectedStation?.site_id === station.site_id}
                    onSelect={(s) => {
                      setSelectedStation(s);
                      // On mobile, if card clicked, switch to map view to show pin
                      if (window.innerWidth < 1024) {
                        setMobileView('map');
                      }
                    }}
                  />

                  {/* Insert AdSlot between station cards after item 3 */}
                  {index === 2 && <AdSlot format="in-feed" className="my-3" />}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#161616] dark:bg-[#161616] light:bg-[#FFFFFF] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] text-center space-y-3">
              <MapPin className="w-10 h-10 text-[#FF6B00] mx-auto opacity-70" />
              <h3 className="text-base font-bold text-white dark:text-white light:text-[#111111]">
                No petrol stations found matching your search
              </h3>
              <p className="text-xs text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] max-w-sm mx-auto">
                Try searching by a broader town name, UK postcode area (e.g. M1, SW1A, B1), or reset your brand filter.
              </p>
              <button
                onClick={() => {
                  setQuery('');
                  setBrand('All Brands');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#E05E00]"
              >
                Reset Search Filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-4 px-2 border-t border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB]">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#161616] dark:bg-[#161616] light:bg-[#F3F4F6] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#FF6B00]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280]">
                Page <span className="font-bold text-white dark:text-white light:text-[#111111]">{currentPage}</span> of{' '}
                <span className="font-bold text-white dark:text-white light:text-[#111111]">{totalPages}</span>
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#161616] dark:bg-[#161616] light:bg-[#F3F4F6] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#FF6B00]"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* High-RPM Affiliate / Lead Conversion Card */}
          <div className="pt-2">
            <AffiliateCard cityOrDistrict={cityOrDistrictName} />
          </div>
        </div>

        {/* Right Column: Sticky Interactive Leaflet Map */}
        <div
          className={`lg:col-span-5 lg:sticky lg:top-20 ${
            mobileView === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="h-[520px] lg:h-[calc(100vh-6.5rem)] w-full">
            <FuelMap
              stations={filteredStations}
              selectedFuel={fuelType}
              cheapestId={cheapestId}
              selectedStation={selectedStation}
              onSelectStation={(s) => setSelectedStation(s)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
