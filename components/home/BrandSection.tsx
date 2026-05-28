"use client";

import { useState } from "react";

const brands = [
  { name: "COSRX",              domain: "cosrx.com" },
  { name: "ANUA",               domain: "anua-global.com" },
  { name: "Beauty of Joseon",   domain: "beautyofjoseon.com" },
  { name: "Medicube",           domain: "medicube.us" },
  { name: "Innisfree",          domain: "innisfree.com" },
  { name: "Laneige",            domain: "laneige.com" },
  { name: "Sulwhasoo",          domain: "sulwhasoo.com" },
  { name: "Klairs",             domain: "klairs.com" },
  { name: "Some By Mi",         domain: "somebymi.com" },
  { name: "Isntree",            domain: "isntree.com" },
];

function BrandLogo({ brand }: { brand: { name: string; domain: string } }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = `https://logo.clearbit.com/${brand.domain}?size=200`;

  return (
    <div className="flex flex-col items-center justify-center px-10 lg:px-16 flex-shrink-0 group cursor-pointer min-w-[180px] lg:min-w-[220px]">
      <div className="h-16 lg:h-20 flex items-center justify-center w-full relative">
        {failed ? (
          <p className="font-display text-2xl lg:text-3xl font-light text-ink-700 group-hover:text-rose-600 transition-colors duration-500 whitespace-nowrap tracking-tight">
            {brand.name}
          </p>
        ) : (
          <img
            src={logoUrl}
            alt={`${brand.name} logo`}
            onError={() => setFailed(true)}
            className="max-h-14 lg:max-h-16 w-auto object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
}

export default function BrandSection() {
  const loop = [...brands, ...brands];

  return (
    <section className="py-14 lg:py-20 border-y border-ink-100 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-10 lg:mb-12">
        <p className="section-subtitle text-center text-rose-600 mb-2">Houses We Curate</p>
        <h2 className="section-title text-center">A Lineup of Cult Korean Labels</h2>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 lg:w-48 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 lg:w-48 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="marquee-track">
          {loop.map((brand, i) => (
            <BrandLogo key={`${brand.name}-${i}`} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}
