"use client";

import { useState } from "react";

interface Brand {
  name: string;
  domain: string;
  origin: "Korea" | "Dubai";
}

const brands: Brand[] = [
  { name: "COSRX", domain: "cosrx.com", origin: "Korea" },
  { name: "ANUA", domain: "anua-global.com", origin: "Korea" },
  { name: "Beauty of Joseon", domain: "beautyofjoseon.com", origin: "Korea" },
  { name: "Medicube", domain: "medicube.us", origin: "Korea" },
  { name: "Innisfree", domain: "innisfree.com", origin: "Korea" },
  { name: "Laneige", domain: "laneige.com", origin: "Korea" },
  { name: "Sulwhasoo", domain: "sulwhasoo.com", origin: "Korea" },
  { name: "Bateel", domain: "bateel.com", origin: "Dubai" },
  { name: "Patchi", domain: "patchi.com", origin: "Dubai" },
  { name: "Mirzam", domain: "mirzam.com", origin: "Dubai" },
  { name: "Al Nassma", domain: "al-nassma.com", origin: "Dubai" },
];

function BrandLogo({ brand }: { brand: Brand }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = `https://logo.clearbit.com/${brand.domain}?size=200`;

  return (
    <div className="flex flex-col items-center justify-center px-10 lg:px-16 flex-shrink-0 group cursor-pointer min-w-[180px] lg:min-w-[220px]">
      <div className="h-16 lg:h-20 flex items-center justify-center w-full mb-2 relative">
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
      <p className="text-[9px] uppercase tracking-[0.4em] text-ink-400 group-hover:text-rose-400 transition-colors whitespace-nowrap">
        {brand.origin}
      </p>
    </div>
  );
}

export default function BrandSection() {
  const loop = [...brands, ...brands];

  return (
    <section className="py-14 lg:py-20 border-y border-ink-100 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-10 lg:mb-12">
        <p className="section-subtitle text-center text-rose-600 mb-2">Houses We Curate</p>
        <h2 className="section-title text-center">A Lineup of Cult Labels</h2>
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
