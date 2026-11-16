'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, Fuel, MapPin, Menu, X, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] bg-[#0A0A0A]/95 dark:bg-[#0A0A0A]/95 light:bg-[#FFFFFF]/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B00] flex items-center justify-center text-white shadow-lg shadow-[#FF6B00]/30 transition-transform group-hover:scale-105">
                <Fuel className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-white dark:text-white light:text-[#111111]">
                  FuelRadar<span className="text-[#FF6B00]">UK</span>
                </span>
                <span className="text-[10px] font-medium text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] -mt-1 hidden sm:block">
                  Real-Time UK Petrol & Diesel Prices
                </span>
              </div>
            </Link>

            {/* Live CMA Data Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161616] dark:bg-[#161616] light:bg-[#F3F4F6] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] text-[11px] text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#4B5563]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Official CMA Open Data</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className="text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111] hover:text-[#FF6B00] transition-colors"
            >
              Price Finder
            </Link>
            <Link
              href="/city/london"
              className="text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] hover:text-[#FF6B00] transition-colors"
            >
              London
            </Link>
            <Link
              href="/city/manchester"
              className="text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] hover:text-[#FF6B00] transition-colors"
            >
              Manchester
            </Link>
            <Link
              href="/city/birmingham"
              className="text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] hover:text-[#FF6B00] transition-colors"
            >
              Birmingham
            </Link>
            <Link
              href="/city/leeds"
              className="text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] hover:text-[#FF6B00] transition-colors"
            >
              Leeds
            </Link>
            <Link
              href="/city/glasgow"
              className="text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280] hover:text-[#FF6B00] transition-colors"
            >
              Glasgow
            </Link>
          </nav>

          {/* Right Controls: Theme Switcher + Mobile Menu Button */}
          <div className="flex items-center gap-3">
            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="relative p-2 rounded-xl bg-[#161616] dark:bg-[#161616] light:bg-[#F3F4F6] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-all"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="md:hidden p-2 rounded-xl bg-[#161616] dark:bg-[#161616] light:bg-[#F3F4F6] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#1E1E1E] dark:hover:bg-[#1E1E1E] light:hover:bg-[#F3F4F6]"
            >
              Live Price Finder
            </Link>
            <div className="px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#6B7280]">
              Popular UK Cities
            </div>
            <div className="grid grid-cols-2 gap-2 px-3">
              {[
                { name: 'London', slug: 'london' },
                { name: 'Manchester', slug: 'manchester' },
                { name: 'Birmingham', slug: 'birmingham' },
                { name: 'Leeds', slug: 'leeds' },
                { name: 'Glasgow', slug: 'glasgow' },
                { name: 'Edinburgh', slug: 'edinburgh' },
                { name: 'Bristol', slug: 'bristol' },
                { name: 'Liverpool', slug: 'liverpool' },
              ].map((c) => (
                <Link
                  key={c.slug}
                  href={`/city/${c.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-2.5 py-1.5 rounded text-xs bg-[#161616] dark:bg-[#161616] light:bg-[#F3F4F6] hover:text-[#FF6B00]"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
