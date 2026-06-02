"use client";

import { useState } from "react";
import Link from "next/link";
import type { Brand } from "@/types";

function BrandLogo({ brand }: { brand: Brand }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <Link
      href={`/shop?brand=${encodeURIComponent(brand.name)}`}
      className="flex flex-col items-center justify-center px-10 lg:px-16 flex-shrink-0 group cursor-pointer min-w-[180px] lg:min-w-[220px]"
    >
      <div className="h-16 lg:h-20 flex items-center justify-center w-full">
        {brand.logo && !imgFailed ? (
          <img
            src={brand.logo}
            alt={`${brand.name} logo`}
            onError={() => setImgFailed(true)}
            className="max-h-14 lg:max-h-16 w-auto object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
            loading="lazy"
          />
        ) : (
          <p className="font-display text-2xl lg:text-3xl font-light text-ink-700 group-hover:text-rose-600 transition-colors duration-500 whitespace-nowrap tracking-tight">
            {brand.name}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function BrandMarquee({ brands }: { brands: Brand[] }) {
  if (!brands.length) return null;
  const loop = [...brands, ...brands];

  return (
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-0 w-24 lg:w-48 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 lg:w-48 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      <div className="marquee-track">
        {loop.map((brand, i) => (
          <BrandLogo key={`${brand._id}-${i}`} brand={brand} />
        ))}
      </div>
    </div>
  );
}
