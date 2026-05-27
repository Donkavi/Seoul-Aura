import Link from "next/link";
import { Plane, Search, PackageCheck, ArrowRight, Sparkles } from "lucide-react";

const steps = [
  { icon: Search, text: "We hunt the source" },
  { icon: PackageCheck, text: "You confirm the quote" },
  { icon: Plane, text: "We import & deliver" },
];

export default function PreOrderCTA() {
  return (
    <section className="py-16 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-900 to-ink-800" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-rose-600/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="text-white space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 px-4 py-2 rounded-full">
              <Sparkles size={14} className="text-rose-300" />
              <span className="text-[10px] font-semibold tracking-[0.3em] uppercase">
                Pre-Order Concierge
              </span>
            </div>

            <h2 className="font-display text-4xl lg:text-6xl font-medium leading-[1.05]">
              Can't find it here?
              <span className="block italic text-rose-300">We'll find it for you.</span>
            </h2>

            <p className="text-base lg:text-lg text-ink-300 max-w-md leading-relaxed">
              The viral Korean drop you saw on TikTok. That premium Dubai chocolate from your trip.
              Tell us what you want — we'll source it from authentic suppliers and import it
              straight to you.
            </p>

            <ul className="space-y-3 pt-2">
              {steps.map((step, i) => (
                <li key={step.text} className="flex items-center gap-3 text-sm">
                  <span className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-rose-300 flex-shrink-0">
                    <step.icon size={14} />
                  </span>
                  <span className="text-white/90">
                    <strong className="text-white">Step {i + 1}.</strong> {step.text}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-4">
              <Link
                href="/pre-order"
                className="bg-white text-ink-900 hover:bg-rose-50 px-7 py-3.5 text-sm font-medium tracking-wide transition-all duration-300 inline-flex items-center gap-2 group"
              >
                Submit a Pre-Order
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <a
                href="https://wa.me/94773398094"
                target="_blank"
                rel="noopener"
                className="border border-white/30 text-white hover:bg-white hover:text-ink-900 px-7 py-3.5 text-sm font-medium tracking-wide transition-all duration-300"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm p-8 lg:p-10 transform lg:rotate-1 hover:rotate-0 transition-transform duration-500">
              <p className="text-[10px] tracking-[0.3em] uppercase text-rose-300 font-semibold mb-4">
                Sample Request
              </p>
              <div className="space-y-3 text-white">
                <Row label="Brand" value="Anua" />
                <Row label="Product" value="Heartleaf 77% Soothing Toner" />
                <Row label="Quantity" value="2" />
                <Row label="Origin" value="🇰🇷 Korea" />
              </div>
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-rose-300 font-semibold">
                    Quoted in
                  </span>
                  <span className="font-display text-2xl text-white">~48 hours</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-rose-300 font-semibold">
                    ETA after confirm
                  </span>
                  <span className="font-display text-2xl text-white">2-3 weeks</span>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-white/70">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse-soft" />
                12 requests being sourced this week
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-white/10">
      <span className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">
        {label}
      </span>
      <span className="text-sm lg:text-base text-white font-medium text-right">{value}</span>
    </div>
  );
}
