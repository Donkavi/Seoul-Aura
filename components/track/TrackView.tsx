"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, MapPin, Package, HelpCircle } from "lucide-react";
import { cn, formatPrice, lineSavings, sumSavings } from "@/lib/utils";
import {
  DELIVERY_PHASES,
  deliveryPhase,
  deliveryPhaseIndex,
  type DeliveryStatus,
} from "@/lib/deliveryStatus";

export interface TrackItem {
  productBrand: string;
  productName: string;
  quantity: number;
  productImage?: string;
  unitPrice?: number;
  /** Shop compare-at price, so the discount shows here just like the invoice email. */
  comparePrice?: number;
  availability?: "available" | "unavailable";
}

export interface TrackEvent {
  status: DeliveryStatus;
  note?: string;
  at: string;
}

export interface TrackData {
  requestNumber: string;
  customerName: string;
  deliveryStatus?: DeliveryStatus | null;
  events: TrackEvent[];
  items: TrackItem[];
  /** Flat delivery fee, added to the priced items' subtotal for the total below. */
  deliveryCharge?: number;
  destination?: { city: string; district: string };
  createdAt: string;
}

/**
 * Dates are pinned to Colombo so the server and the browser render the same
 * string — otherwise every timestamp hydrates as a mismatch.
 */
const TZ = "Asia/Colombo";

function longDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });
}

function timeOfDay(value: string) {
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

/**
 * A short burst of petals over the final stop once the parcel lands. The
 * offsets are a fixed list rather than random so the server and the client
 * render the same thing.
 */
const PETALS = [
  { cx: "-34px", cy: "-30px", delay: "0s", color: "#E8527A" },
  { cx: "26px", cy: "-38px", delay: "0.18s", color: "#FBBF24" },
  { cx: "-14px", cy: "-46px", delay: "0.36s", color: "#FFA0B8" },
  { cx: "40px", cy: "-18px", delay: "0.54s", color: "#D4375E" },
  { cx: "-42px", cy: "-12px", delay: "0.72s", color: "#FEF3C7" },
  { cx: "10px", cy: "-48px", delay: "0.9s", color: "#F4799A" },
  { cx: "34px", cy: "-34px", delay: "1.08s", color: "#FFC2D1" },
  { cx: "-26px", cy: "-40px", delay: "1.26s", color: "#F59E0B" },
];

function Confetti() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="animate-confetti absolute w-1.5 h-2.5 rounded-full"
          style={
            {
              background: p.color,
              animationDelay: p.delay,
              ["--cx" as string]: p.cx,
              ["--cy" as string]: p.cy,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

/**
 * The rail segment running from this stop to the next one. Each segment fills
 * on its own — that keeps the line exactly on the dots whatever height the
 * labels take, and gives the fill its travelling, leg-by-leg feel.
 */
function Connector({
  filled,
  index,
  vertical,
}: {
  filled: boolean;
  index: number;
  vertical: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute overflow-hidden rounded-full bg-ink-100",
        vertical
          ? "left-5 -translate-x-1/2 top-11 bottom-0 w-0.5"
          : "top-5 left-[calc(50%+22px)] w-[calc(100%-44px)] h-0.5 -translate-y-1/2"
      )}
    >
      <span
        className="relative block bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-700 ease-out"
        style={{
          transitionDelay: `${300 + index * 260}ms`,
          ...(vertical
            ? { width: "100%", height: filled ? "100%" : "0%" }
            : { height: "100%", width: filled ? "100%" : "0%" }),
        }}
      >
        {filled && (
          <span className="animate-track-sweep absolute inset-y-0 w-1/3 bg-white/60" />
        )}
      </span>
    </span>
  );
}

/** One stop on the journey — the dot, its label and the leg that follows it. */
function Stop({
  index,
  currentIndex,
  vertical,
  filled,
  eventAt,
}: {
  index: number;
  currentIndex: number;
  vertical: boolean;
  /** Whether the leg leaving this stop has been travelled. */
  filled: boolean;
  eventAt?: string;
}) {
  const phase = DELIVERY_PHASES[index];
  const last = index === DELIVERY_PHASES.length - 1;
  const done = index < currentIndex;
  const isCurrent = index === currentIndex;
  const reached = index <= currentIndex;

  return (
    <div
      className={cn(
        "relative flex",
        vertical ? "items-start gap-4" : "flex-1 flex-col items-center text-center"
      )}
    >
      {!last && <Connector filled={filled} index={index} vertical={vertical} />}

      {/* Dot */}
      <div
        className="animate-track-pop relative flex-shrink-0 z-10"
        style={{ animationDelay: `${180 + index * 140}ms` }}
      >
        {isCurrent && (
          <>
            <span
              aria-hidden
              className="animate-track-halo absolute inset-0 rounded-full bg-rose-400"
            />
            <span
              aria-hidden
              className="animate-track-halo absolute inset-0 rounded-full bg-rose-300"
              style={{ animationDelay: "1.2s" }}
            />
          </>
        )}
        <div
          className={cn(
            "relative w-10 h-10 rounded-full flex items-center justify-center text-base transition-colors duration-500",
            reached
              ? "bg-rose-600 text-white shadow-rose"
              : "bg-white text-ink-300 border border-ink-200"
          )}
        >
          {done ? (
            <Check size={17} strokeWidth={3} />
          ) : reached ? (
            <span className="leading-none">{phase.emoji}</span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-ink-300" />
          )}
        </div>

        {/* The parcel rides above the stop it has reached. Centering (a static
            transform: translateX) and the bob (an animated transform) live on
            separate elements — a CSS animation replaces the whole `transform`
            value on the element it runs on, so stacking them on one node would
            silently drop the centering the moment the bob animation starts. */}
        {isCurrent && !last && (
          <span
            aria-hidden
            className={cn(
              "absolute text-xl select-none",
              vertical ? "-right-8 top-1" : "-top-9 left-1/2 -translate-x-1/2"
            )}
          >
            <span className="animate-track-bob inline-block">{phase.emoji}</span>
          </span>
        )}
        {last && isCurrent && <Confetti />}
      </div>

      {/* Label */}
      <div
        className={cn(
          "animate-track-pop",
          vertical ? (last ? "pt-1.5" : "pt-1.5 pb-10") : "px-1 mt-3"
        )}
        style={{ animationDelay: `${240 + index * 140}ms` }}
      >
        <p
          className={cn(
            "text-[13px] font-medium leading-snug transition-colors duration-500",
            isCurrent ? "text-rose-700" : reached ? "text-ink-900" : "text-ink-300"
          )}
        >
          {phase.label}
        </p>
        {eventAt ? (
          <p className="text-[11px] text-ink-400 mt-1 whitespace-nowrap">
            {longDate(eventAt)}
          </p>
        ) : (
          <p className="text-[11px] text-ink-300 mt-1">Upcoming</p>
        )}
      </div>
    </div>
  );
}

/**
 * The centerpiece animation, different for every phase of the journey —
 * a plane cruising through clouds while it's in the air, a landing arc as it
 * touches down, a truck bouncing down a scrolling road once it's with the
 * courier, and a bursting celebration once it's delivered.
 */
function HeroScene({ phaseKey }: { phaseKey?: DeliveryStatus }) {
  const emoji = deliveryPhase(phaseKey ?? undefined)?.emoji;

  if (!phaseKey) {
    return (
      <div className="h-28 sm:h-32 flex items-center justify-center">
        <span className="animate-track-bob inline-block text-5xl sm:text-6xl leading-none">
          📦
        </span>
      </div>
    );
  }

  if (phaseKey === "sent_from_korea") {
    return (
      <div className="relative h-28 sm:h-32 overflow-hidden rounded-sm bg-gradient-to-b from-sky-50 to-white">
        <span
          className="animate-hero-cloud absolute top-6 text-2xl opacity-70"
          style={{ animationDuration: "11s" }}
        >
          ☁️
        </span>
        <span
          className="animate-hero-cloud absolute top-14 text-lg opacity-45"
          style={{ animationDuration: "8s", animationDelay: "-3s" }}
        >
          ☁️
        </span>
        <span
          className="animate-hero-cloud absolute top-9 text-xl opacity-55"
          style={{ animationDuration: "14s", animationDelay: "-6s" }}
        >
          ☁️
        </span>
        <span className="animate-hero-fly absolute top-1/2 text-5xl sm:text-6xl leading-none">
          ✈️
        </span>
      </div>
    );
  }

  if (phaseKey === "arrived_in_sri_lanka") {
    return (
      <div className="relative h-28 sm:h-32 overflow-hidden rounded-sm bg-gradient-to-b from-sky-50 to-white">
        <span
          className="animate-hero-cloud absolute top-5 text-xl opacity-50"
          style={{ animationDuration: "13s" }}
        >
          ☁️
        </span>
        <span
          className="animate-hero-cloud absolute top-10 text-base opacity-30"
          style={{ animationDuration: "9s", animationDelay: "-4s" }}
        >
          ☁️
        </span>
        {/* Rests and rocks gently as it taxis in — a continuous motion rather
            than a one-off swoop, so it never reads as parked. */}
        <div className="absolute inset-0 flex items-center justify-center pb-3">
          <span className="animate-hero-land inline-block text-5xl sm:text-6xl leading-none">
            🛬
          </span>
        </div>
        {/* A little strip of ground so the touchdown reads as an arrival,
            with a glint sweeping across it for a second layer of motion. */}
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-ink-200/70 overflow-hidden">
          <span className="animate-track-sweep absolute inset-y-0 w-1/3 bg-white/80" />
        </span>
      </div>
    );
  }

  if (phaseKey === "cleared_customs") {
    return (
      <div className="relative h-28 sm:h-32 overflow-hidden rounded-sm bg-gradient-to-b from-gold-50 to-white flex flex-col items-center justify-center gap-1.5">
        {/* The stamp thumps down to approve the parcel. Centering (a static
            transform) and the drop (an animated transform) live on separate
            elements — see the same note on the Stop component's floating icon. */}
        <span className="relative inline-block">
          <span className="animate-hero-stamp inline-block text-5xl sm:text-6xl leading-none origin-bottom">
            🛃
          </span>
          <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 pointer-events-none">
            <span className="animate-hero-stamp-flash block w-9 h-9 rounded-full bg-gold-400/70" />
          </span>
        </span>
        {/* The paperwork being stamped */}
        <span className="text-2xl opacity-80 leading-none">📄</span>
      </div>
    );
  }

  if (phaseKey === "handed_to_delivery") {
    return (
      <div className="relative h-28 sm:h-32 overflow-hidden rounded-sm bg-gradient-to-b from-rose-25 to-white">
        <div className="absolute inset-x-0 bottom-9 flex justify-center">
          <span className="animate-hero-dust text-base opacity-0" style={{ animationDelay: "0.1s" }}>
            💨
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-9 flex justify-center">
          <span className="animate-hero-truck inline-block text-5xl sm:text-6xl leading-none">
            🚚
          </span>
        </div>
        {/* Scrolling dashed road, selling the drive */}
        <div
          className="animate-hero-road absolute bottom-6 left-0 right-0 h-1.5 rounded-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #D4375E 0 24px, transparent 24px 40px)",
          }}
        />
      </div>
    );
  }

  // delivered
  return (
    <div className="relative h-28 sm:h-32 flex items-center justify-center overflow-hidden">
      <span className="animate-track-halo absolute w-16 h-16 rounded-full bg-rose-300" />
      <span
        className="animate-track-halo absolute w-16 h-16 rounded-full bg-gold-400"
        style={{ animationDelay: "1.2s" }}
      />
      <span className="animate-hero-delivered relative inline-block text-5xl sm:text-6xl leading-none">
        {emoji}
      </span>
      <Confetti />
    </div>
  );
}

export default function TrackView({ data }: { data: TrackData }) {
  const currentIndex = deliveryPhaseIndex(data.deliveryStatus);
  const shipped = currentIndex >= 0;
  const phase = shipped ? DELIVERY_PHASES[currentIndex] : undefined;

  // Legs start empty for one frame so the rail is seen to fill, not to appear.
  const [travelled, setTravelled] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setTravelled(Math.max(0, currentIndex)));
    return () => cancelAnimationFrame(id);
  }, [currentIndex]);

  /** When each phase was reached, for the dated labels under every stop. */
  const reachedAt = new Map<DeliveryStatus, string>();
  data.events.forEach((ev) => {
    if (!reachedAt.has(ev.status)) reachedAt.set(ev.status, ev.at);
  });

  const totalUnits = data.items.reduce((sum, it) => sum + it.quantity, 0);
  const firstName = data.customerName.split(" ")[0];

  // Only available, priced items count toward the totals — matching the
  // account page and admin invoice for the same order.
  const availableItems = data.items.filter((it) => it.availability !== "unavailable");
  const hasPrices = availableItems.length > 0 && availableItems.every((it) => it.unitPrice != null);
  const subtotal = hasPrices
    ? availableItems.reduce((sum, it) => sum + it.unitPrice! * it.quantity, 0)
    : 0;
  const savings = hasPrices
    ? sumSavings(availableItems.map((it) => ({ price: it.unitPrice!, comparePrice: it.comparePrice, quantity: it.quantity })))
    : 0;
  const deliveryCharge = data.deliveryCharge ?? 0;
  const total = subtotal + deliveryCharge;

  const stops = (vertical: boolean) =>
    DELIVERY_PHASES.map((p, i) => (
      <Stop
        key={p.key}
        index={i}
        currentIndex={currentIndex}
        vertical={vertical}
        filled={i < travelled}
        eventAt={reachedAt.get(p.key)}
      />
    ));

  return (
    <div className="bg-gradient-to-b from-rose-25 via-white to-white">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <header className="text-center animate-fade-up">
          <p className="section-subtitle text-rose-600">Order Tracking</p>
          <p className="font-mono text-xs text-ink-400 mt-2">{data.requestNumber}</p>

          <div className="mt-6 mb-4 max-w-xs mx-auto">
            <HeroScene phaseKey={data.deliveryStatus ?? undefined} />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl text-ink-900 tracking-tight text-balance">
            {phase?.label ?? "Preparing your order"}
          </h1>
          <p className="text-sm text-ink-500 leading-relaxed mt-3 max-w-md mx-auto text-balance">
            {shipped
              ? `Hi ${firstName}, ${phase!.detail}`
              : `Hi ${firstName}, your order is being prepared. We'll update this page the moment it leaves Korea.`}
          </p>
        </header>

        {/* ── The journey ──────────────────────────────────────────────────── */}
        <section
          className="mt-12 sm:mt-14 bg-white border border-ink-100 rounded-sm shadow-card px-5 sm:px-8 py-8 sm:py-10 animate-fade-up animate-delay-100"
          aria-label="Delivery progress"
        >
          <div className="hidden md:flex items-start">{stops(false)}</div>
          <div className="md:hidden">{stops(true)}</div>
        </section>

        {/* ── Dated history, including any note from the team ──────────────── */}
        {data.events.length > 0 && (
          <section className="mt-8 animate-fade-up animate-delay-200">
            <h2 className="section-subtitle text-ink-400 mb-4">Journey so far</h2>
            <ol className="space-y-3">
              {[...data.events].reverse().map((ev, i) => {
                const meta = DELIVERY_PHASES.find((p) => p.key === ev.status);
                if (!meta) return null;
                const latest = i === 0;
                return (
                  <li
                    key={`${ev.status}-${ev.at}`}
                    className={cn(
                      "animate-fade-up border rounded-sm px-4 py-3.5 flex gap-3",
                      latest ? "border-rose-200 bg-rose-25/60" : "border-ink-100 bg-white"
                    )}
                    style={{ animationDelay: `${240 + i * 80}ms` }}
                  >
                    <span className="text-lg leading-none pt-0.5">{meta.emoji}</span>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          latest ? "text-rose-700" : "text-ink-900"
                        )}
                      >
                        {meta.label}
                      </p>
                      <p className="text-[11px] text-ink-400 mt-0.5">
                        {longDate(ev.at)} · {timeOfDay(ev.at)}
                      </p>
                      {ev.note && (
                        <p className="text-xs text-ink-600 leading-relaxed mt-1.5">{ev.note}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* ── What's in the parcel ─────────────────────────────────────────── */}
        <section className="mt-8 animate-fade-up animate-delay-300">
          <h2 className="section-subtitle text-ink-400 mb-4">
            In this parcel · {totalUnits} item{totalUnits !== 1 ? "s" : ""}
          </h2>
          <div className="bg-white border border-ink-100 rounded-sm divide-y divide-ink-50">
            {data.items.map((it, i) => {
              const unavail = it.availability === "unavailable";
              const lineTotal = it.unitPrice != null ? it.unitPrice * it.quantity : null;
              const lineSaved =
                it.unitPrice != null && !unavail ? lineSavings(it.unitPrice, it.comparePrice, it.quantity) : 0;

              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-11 h-11 rounded border border-ink-100 bg-ink-50 overflow-hidden flex-shrink-0">
                    {it.productImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.productImage}
                        alt={it.productName}
                        className={cn("w-full h-full object-cover", unavail && "opacity-40")}
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-full h-full flex items-center justify-center text-base",
                          unavail && "opacity-40"
                        )}
                      >
                        🧴
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold">
                      {it.productBrand}
                    </p>
                    <p
                      className={cn(
                        "text-sm leading-snug truncate",
                        unavail ? "text-ink-400 line-through" : "text-ink-900"
                      )}
                    >
                      {it.productName}
                    </p>
                    {unavail && (
                      <p className="text-[10px] text-ink-400 mt-0.5">Not available — excluded from your total</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-ink-400">×{it.quantity}</p>
                    {lineTotal != null && (
                      <>
                        <p
                          className={cn(
                            "text-sm font-semibold mt-0.5",
                            unavail ? "text-ink-400 line-through" : "text-ink-900"
                          )}
                        >
                          {formatPrice(lineTotal)}
                        </p>
                        {lineSaved > 0 && (
                          <p className="text-[10px] font-medium text-gold-600">
                            Saved {formatPrice(lineSaved)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {hasPrices && (
            <div className="bg-white border border-ink-100 rounded-sm mt-3 px-4 py-3.5">
              <div className="space-y-1.5 text-xs">
                {savings > 0 && (
                  <div className="flex justify-between text-gold-600 font-medium">
                    <span>You saved</span>
                    <span>-{formatPrice(savings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-ink-500">
                  <span>Delivery</span>
                  <span>{deliveryCharge === 0 ? "Free" : formatPrice(deliveryCharge)}</span>
                </div>
              </div>
              <div className="flex justify-between items-baseline mt-2.5 pt-2.5 border-t border-ink-50">
                <span className="text-sm font-semibold text-ink-900">Total</span>
                <span className="text-base font-bold text-ink-900">{formatPrice(total)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs text-ink-500">
            {data.destination && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-rose-400" />
                {data.destination.city}, {data.destination.district}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Package size={13} className="text-rose-400" />
              Ordered {longDate(data.createdAt)}
            </span>
          </div>
        </section>

        {/* ── Help ─────────────────────────────────────────────────────────── */}
        <footer className="mt-10 text-center animate-fade-up animate-delay-400">
          <p className="text-xs text-ink-400 inline-flex items-center gap-1.5 flex-wrap justify-center">
            <HelpCircle size={13} />
            Something not right?
            <a
              href="https://wa.me/94778362755"
              target="_blank"
              rel="noopener"
              className="text-rose-600 hover:underline font-medium"
            >
              Message us on WhatsApp
            </a>
          </p>
          <p className="text-xs text-ink-400 mt-3">
            <Link href="/account?tab=pre-orders" className="hover:text-rose-600">
              View all your pre-orders
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
