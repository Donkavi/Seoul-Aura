"use client";

import { useEffect, useRef, useState } from "react";
import { Users, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // ease-out quart
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setCount(target);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

export default function CommunityStats() {
  const [userCount, setUserCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [ready, setReady] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/users?limit=1").then((r) => r.json()),
      fetch("/api/products?admin=true&limit=1").then((r) => r.json()),
    ]).then(([userData, productData]) => {
      setUserCount(userData.total ?? 0);
      setProductCount(productData.total ?? 0);
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  // Only start counting when section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const shouldCount = ready && inView;
  const animatedUsers = useCountUp(shouldCount ? userCount : 0, 2200);
  const animatedProducts = useCountUp(shouldCount ? productCount : 0, 1600);
  const animatedReviews = useCountUp(shouldCount ? 4.9 * 10 : 0, 1400);

  return (
    <section ref={sectionRef} className="relative bg-ink-900 overflow-hidden py-20 lg:py-28">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-rose-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-rose-400/8 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-rose-900/20 blur-[80px]" />

      <div className="relative max-w-7xl mx-auto px-4 lg:px-8">

        {/* Live pill */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full px-5 py-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-emerald-400">
              Live Community Stats
            </span>
          </div>
        </div>

        {/* Main hero count */}
        <div className="text-center mb-16">
          <p className="text-ink-400 text-sm uppercase tracking-[0.3em] font-medium mb-4">
            Seoul Aura Members
          </p>

          <div className="relative inline-block">
            {/* Decorative lines */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 lg:-translate-x-20 flex items-center gap-1.5">
              <div className="w-8 lg:w-16 h-px bg-gradient-to-r from-transparent to-rose-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 lg:translate-x-20 flex items-center gap-1.5 flex-row-reverse">
              <div className="w-8 lg:w-16 h-px bg-gradient-to-l from-transparent to-rose-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
            </div>

            <span className="font-display text-[72px] sm:text-[100px] md:text-[130px] lg:text-[160px] xl:text-[180px] leading-none font-medium text-white tabular-nums tracking-tight">
              {animatedUsers.toLocaleString()}
            </span>
            <span className="font-display text-[72px] sm:text-[100px] md:text-[130px] lg:text-[160px] xl:text-[180px] leading-none font-medium text-rose-500">
              +
            </span>
          </div>

          <p className="font-display text-xl md:text-2xl lg:text-3xl text-rose-300/80 italic mt-1">
            beauty enthusiasts &amp; counting
          </p>
          <p className="text-ink-500 text-sm mt-3 max-w-md mx-auto leading-relaxed">
            Join thousands of K-Beauty lovers across Sri Lanka discovering authentic products from Seoul.
          </p>
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto">
          {[
            {
              icon: ShoppingBag,
              value: animatedProducts.toLocaleString(),
              suffix: "+",
              label: "Products",
              desc: "Curated items",
            },
            {
              icon: Users,
              value: animatedUsers.toLocaleString(),
              suffix: "+",
              label: "Members",
              desc: "Registered users",
            },
            {
              icon: Star,
              value: (animatedReviews / 10).toFixed(1),
              suffix: "",
              label: "Rating",
              desc: "Average score",
            },
          ].map(({ icon: Icon, value, suffix, label, desc }) => (
            <div
              key={label}
              className="text-center p-4 md:p-6 bg-white/[0.03] border border-white/[0.06] rounded-sm backdrop-blur-sm hover:bg-white/[0.05] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-rose-600/20 flex items-center justify-center mx-auto mb-3">
                <Icon size={14} className="text-rose-400" />
              </div>
              <p className="font-display text-2xl md:text-3xl text-white tabular-nums font-medium">
                {value}<span className="text-rose-500">{suffix}</span>
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-300 mt-1">{label}</p>
              <p className="text-[10px] text-ink-600 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-8 py-3.5 transition-colors tracking-wide"
          >
            <Users size={15} />
            Join the Community
          </Link>
        </div>
      </div>
    </section>
  );
}
