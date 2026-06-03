"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroMedia {
  url: string;
  type: "image" | "video";
}

interface Slide {
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  description: string;
  cta: string;
  ctaHref: string;
  image: string;
  align: "left" | "right";
  bgGradient: string;
  textColor: string;
  accentColor: string;
}

const slides: Slide[] = [
  {
    badge: "New Season · K-Beauty Edit",
    title: "The Ultimate",
    highlight: "Glow Booster",
    subtitle: "from Seoul to your skin",
    description:
      "Discover authentic K-Beauty essentials hand-picked, freshly imported, and delivered with care.",
    cta: "Shop The Edit",
    ctaHref: "/shop?origin=Korea",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&h=900&fit=crop",
    align: "left",
    bgGradient: "from-rose-50 via-white to-rose-100/60",
    textColor: "text-ink-900",
    accentColor: "text-rose-600",
  },
  {
    badge: "Viral on TikTok",
    title: "Shop the",
    highlight: "Viral Brands",
    subtitle: "taking over your feed",
    description:
      "Unique formulations. Cute packaging. The cult-favorite Korean brands everyone is talking about — now in Sri Lanka.",
    cta: "Shop Now",
    ctaHref: "/shop?type=Cosmetics",
    image:
      "https://images.unsplash.com/photo-1631730486572-226d1f595b68?w=1600&h=900&fit=crop",
    align: "right",
    bgGradient: "from-blue-50 via-white to-rose-50",
    textColor: "text-blue-900",
    accentColor: "text-blue-600",
  },
  {
    badge: "Monthly Subscription",
    title: "A curated",
    highlight: "surprise",
    subtitle: "on your doorstep",
    description:
      "Hand-picked Korean beauty boxes delivered every month — freshly imported and full of surprises.",
    cta: "Explore Subscriptions",
    ctaHref: "/subscriptions",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1600&h=900&fit=crop",
    align: "right",
    bgGradient: "from-rose-100 via-rose-50 to-white",
    textColor: "text-ink-900",
    accentColor: "text-rose-600",
  },
];

export default function HeroBanner() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 28 });
  const [selected, setSelected] = useState(0);
  const [heroMedia, setHeroMedia] = useState<HeroMedia[]>([]);
  const DEFAULT_MARQUEE = ["100% Authentic K-Beauty", "Free Shipping Over Rs. 10,000", "Free Sample with Every Order", "Islandwide Delivery", "Direct From Seoul"];
  const [marqueeItems, setMarqueeItems] = useState<string[]>(DEFAULT_MARQUEE);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.heroSlides) && data.heroSlides.length > 0) {
          setHeroMedia(data.heroSlides.slice(0, slides.length));
        }
        if (Array.isArray(data?.marqueeItems) && data.marqueeItems.length > 0) {
          setMarqueeItems(data.marqueeItems);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();

    const interval = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, i) => (
            <div
              key={i}
              className={cn(
                "flex-[0_0_100%] relative bg-gradient-to-br h-[520px] md:h-[600px] lg:h-[640px]",
                slide.bgGradient
              )}
            >
              {heroMedia[i]?.type === "video" ? (
                <video
                  src={heroMedia[i].url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover",
                    slide.align === "left" ? "object-right" : "object-left"
                  )}
                />
              ) : (
                <Image
                  src={heroMedia[i]?.url ?? slide.image}
                  alt={slide.title}
                  fill
                  className={cn(
                    "object-cover",
                    slide.align === "left" ? "object-right" : "object-left"
                  )}
                  sizes="100vw"
                  priority={i === 0}
                />
              )}

              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-r",
                  slide.align === "left"
                    ? "from-white via-white/85 to-transparent"
                    : "from-transparent via-white/85 to-white"
                )}
              />

              <div className="relative h-full max-w-7xl mx-auto px-4 lg:px-8 flex items-center">
                <div
                  className={cn(
                    "max-w-xl space-y-5 animate-fade-up",
                    slide.align === "right" && "ml-auto text-right"
                  )}
                >
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-ink-100",
                      slide.align === "right" && "ml-auto"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full animate-pulse-soft",
                        slide.accentColor.replace("text-", "bg-")
                      )}
                    />
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-ink-700">
                      {slide.badge}
                    </span>
                  </div>

                  <h1
                    className={cn(
                      "font-display text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.02] tracking-tight",
                      slide.textColor
                    )}
                  >
                    {slide.title}{" "}
                    <span className={cn("italic", slide.accentColor)}>
                      {slide.highlight}
                    </span>
                    <span className="block text-2xl md:text-3xl font-light text-ink-500 mt-3">
                      {slide.subtitle}
                    </span>
                  </h1>

                  <p
                    className={cn(
                      "text-base lg:text-lg text-ink-600 leading-relaxed",
                      slide.align === "right" ? "ml-auto max-w-md" : "max-w-md"
                    )}
                  >
                    {slide.description}
                  </p>

                  <div
                    className={cn(
                      "flex gap-3 pt-2",
                      slide.align === "right" && "justify-end"
                    )}
                  >
                    <Link
                      href={slide.ctaHref}
                      className="bg-ink-900 hover:bg-rose-600 text-white font-medium px-7 py-3.5 text-sm tracking-wide transition-all duration-300 inline-flex items-center gap-2 group"
                    >
                      {slide.cta}
                      <ArrowRight
                        size={16}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => emblaApi?.scrollPrev()}
        aria-label="Previous slide"
        className="absolute left-3 lg:left-8 top-1/2 -translate-y-1/2 w-11 h-11 lg:w-12 lg:h-12 bg-white/70 hover:bg-white backdrop-blur rounded-full flex items-center justify-center shadow-card transition-all hover:scale-110 z-10"
      >
        <ChevronLeft size={20} className="text-ink-900" />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        aria-label="Next slide"
        className="absolute right-3 lg:right-8 top-1/2 -translate-y-1/2 w-11 h-11 lg:w-12 lg:h-12 bg-white/70 hover:bg-white backdrop-blur rounded-full flex items-center justify-center shadow-card transition-all hover:scale-110 z-10"
      >
        <ChevronRight size={20} className="text-ink-900" />
      </button>

      <div className="absolute bottom-6 lg:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {slides.map((_slide, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="group p-1"
          >
            <span
              className={cn(
                "block h-1 rounded-full transition-all duration-500",
                i === selected
                  ? "w-10 bg-ink-900"
                  : "w-5 bg-ink-300 group-hover:bg-ink-500"
              )}
            />
          </button>
        ))}
      </div>

      <div className="bg-ink-900 text-white py-3 overflow-hidden">
        <div className="marquee-track marquee-fast">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-12 text-xs uppercase tracking-[0.3em] font-medium whitespace-nowrap pr-12">
              {marqueeItems.map((item, i) => (
                <span key={i} className="flex items-center gap-12">
                  <span>✦ {item}</span>
                  <span className="text-rose-400">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
