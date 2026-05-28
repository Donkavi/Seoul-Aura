"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const FALLBACK_GRADIENTS = [
  "from-rose-300 to-pink-400",
  "from-violet-300 to-purple-400",
  "from-amber-300 to-orange-400",
  "from-emerald-300 to-teal-400",
  "from-sky-300 to-blue-400",
  "from-fuchsia-300 to-rose-400",
  "from-pink-300 to-rose-500",
  "from-indigo-300 to-violet-400",
  "from-orange-300 to-amber-500",
  "from-teal-300 to-emerald-500",
];

interface ConcernItem {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

// Number of circles visible at once on desktop / mobile
const VISIBLE_LG = 6;
const VISIBLE_SM = 3;

export default function SkinConcernsSlider({ concerns }: { concerns: ConcernItem[] }) {
  const [offset, setOffset] = useState(0);

  // Use VISIBLE_LG as the cap for slider logic (CSS handles mobile columns)
  const maxOffset = Math.max(0, concerns.length - VISIBLE_LG);
  const canPrev = offset > 0;
  const canNext = offset < maxOffset;

  const prev = () => setOffset((o) => Math.max(0, o - 1));
  const next = () => setOffset((o) => Math.min(maxOffset, o + 1));

  // Each item is 1/6 of the track width (gap included via calc).
  // translateX shifts by offset × (100% / VISIBLE_LG) per step.
  const translateX = `calc(-${offset} * (100% / ${VISIBLE_LG}))`;

  return (
    <div className="relative">
      {/* ← Prev */}
      <button
        onClick={prev}
        disabled={!canPrev}
        aria-label="Previous"
        className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-ink-100 flex items-center justify-center text-ink-700 hover:text-rose-600 hover:border-rose-200 transition-all disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Clip window */}
      <div className="overflow-hidden">
        {/*
          Single-row flex track.
          Each item is fixed to exactly 1/6 of the visible window width (desktop).
          On mobile (< lg) the clip window itself shows 3 items via the item width calc.
        */}
        <div
          className="flex gap-3 lg:gap-5 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(${translateX})` }}
        >
          {concerns.map((c, i) => (
            <div
              key={c._id}
              // Desktop: 6 visible → each item = (100% − 5 gaps) / 6
              // Mobile:  3 visible → each item = (100% − 2 gaps) / 3
              className="shrink-0 w-[calc((100%-2*0.75rem)/3)] lg:w-[calc((100%-5*1.25rem)/6)]"
            >
              <Link
                href={`/shop?concern=${c.slug}`}
                className="group relative aspect-square rounded-full overflow-hidden block"
              >
                {c.image ? (
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 768px) 33vw, 16vw"
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length]
                    }`}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-4 text-center px-1">
                  <p className="font-display text-base lg:text-xl text-white font-medium drop-shadow leading-tight">
                    {c.name}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* → Next */}
      <button
        onClick={next}
        disabled={!canNext}
        aria-label="Next"
        className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-ink-100 flex items-center justify-center text-ink-700 hover:text-rose-600 hover:border-rose-200 transition-all disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dot indicators — only when there are more than 6 */}
      {concerns.length > VISIBLE_LG && (
        <div className="flex justify-center gap-1.5 mt-6">
          {Array.from({ length: maxOffset + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setOffset(i)}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                offset === i
                  ? "w-5 h-2 bg-rose-500"
                  : "w-2 h-2 bg-ink-200 hover:bg-ink-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
