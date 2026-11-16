import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://fuelradar.co.uk'),
  title: {
    default: 'FuelRadarUK | Real-Time UK Petrol & Diesel Prices & Station Map',
    template: '%s | FuelRadarUK',
  },
  description:
    'Find the cheapest petrol (E10, E5) and diesel (B7, SDV) near you in the UK. Real-time fuel price tracker powered by official UK CMA Open Data feeds.',
  keywords: [
    'petrol prices near me',
    'diesel prices near me',
    'uk fuel price map',
    'cheapest petrol london',
    'cheapest diesel manchester',
    'e10 petrol price',
    'asda petrol price',
    'tesco fuel prices',
    'cma fuel data uk',
  ],
  authors: [{ name: 'FuelRadarUK' }],
  creator: 'FuelRadarUK',
  publisher: 'FuelRadarUK',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://fuelradar.co.uk',
    siteName: 'FuelRadarUK',
    title: 'FuelRadarUK | Real-Time UK Petrol & Diesel Prices & Station Map',
    description:
      'Save money on every fill. Real-time UK fuel price finder with interactive map, 50-litre tank cost calculator, and CMA Open Data updates.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FuelRadarUK | Real-Time UK Petrol & Diesel Prices',
    description: 'Find the cheapest petrol & diesel stations across the UK.',
  },
};

export const viewport: Viewport = {
  themeColor: '#FF6B00',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#FFFFFF] text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111] antialiased min-h-screen flex flex-col transition-colors duration-200">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
