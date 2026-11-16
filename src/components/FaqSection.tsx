'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'What is the difference between E10 and E5 petrol in the UK?',
    answer:
      'E10 is the standard UK unleaded petrol (95 RON) and contains up to 10% renewable bioethanol to reduce CO2 emissions. It is compatible with approximately 95% of all petrol cars on UK roads. E5 is premium super unleaded (97 to 99 RON) with up to 5% bioethanol. E5 is recommended for classic cars, older vehicles produced before 2011 without E10 clearance, and high-performance engines that benefit from higher octane ratings.',
  },
  {
    question: 'Is supermarket fuel worse for your car engine than branded fuel (BP, Shell, Esso)?',
    answer:
      'All petrol and diesel sold in the United Kingdom must strictly adhere to British Standards (BS EN 228 for petrol and BS EN 590 for diesel). Supermarket fuel (Asda, Tesco, Sainsbury’s, Morrisons) comes from the same commercial refineries and terminals as branded fuels. The primary difference is the proprietary additive packages injected by premium brands (such as Shell V-Power or BP Ultimate) which contain specialized detergents designed to clean engine valves and fuel injectors over time.',
  },
  {
    question: 'How often are UK fuel prices updated on FuelRadarUK?',
    answer:
      'FuelRadarUK does not show live prices yet. The current prices are a snapshot of retailer feeds published under the Competition and Markets Authority (CMA) interim fuel price scheme, which closed on 1 May 2026, and they cover mainly Asda and Applegreen stations. We plan to switch to live data from the Government’s Fuel Finder scheme; the date of the current snapshot is shown at the top of every page.',
  },
  {
    question: 'How is the 50-Litre Tank Fill Cost and savings calculated?',
    answer:
      'The 50-Litre Tank Cost is calculated as (50 litres × Price per Litre in Pence) ÷ 100 to give the exact fill price in Pounds Sterling (£). Estimated savings are calculated against the average price across the stations in our dataset, which is not a UK-wide average. For example, if a station charges 131.7p/L compared to a dataset average of 139.9p/L, saving 8.2p per litre equates to £4.10 saved on a full 50-litre tank.',
  },
  {
    question: 'How does FuelRadarUK help save money with Clean Air Zones and ULEZ?',
    answer:
      'Beyond pump prices, driving through London’s Ultra Low Emission Zone (ULEZ) or regional Clean Air Zones (such as Birmingham, Bristol, Newcastle, and Bath) without a compliant vehicle carries heavy daily surcharges (£12.50 in London). FuelRadarUK integrates with official ULEZ vehicle checkers and car insurance comparison tools to help drivers lower total running costs.',
  },
];

export default function FaqSection({ locationName }: { locationName?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  // Structured Data Schema for Google Rich Results (FAQPage)
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="w-full rounded-2xl bg-[#161616] dark:bg-[#161616] light:bg-[#FFFFFF] border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] p-6 sm:p-8 shadow-xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="flex items-center gap-2 mb-2">
        <HelpCircle className="w-5 h-5 text-[#FF6B00]" />
        <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
          UK Fuel Knowledge Base
        </span>
      </div>

      <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111] mb-6">
        Frequently Asked Questions about UK Petrol & Diesel Prices {locationName ? `in ${locationName}` : ''}
      </h2>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-xl border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#F9FAFB] overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111] hover:text-[#FF6B00] transition-colors gap-4"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#A3A3A3] shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[#FF6B00]' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-[#A3A3A3] dark:text-[#A3A3A3] light:text-[#4B5563] leading-relaxed border-t border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
