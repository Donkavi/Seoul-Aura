import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function FeatureBanner() {
  return (
    <section className="relative h-[280px] lg:h-[400px] overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1522335789203-aaa6f8e54c46?w=1600&h=600&fit=crop"
        alt="Korean beauty essentials"
        fill
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-rose-900/30 via-rose-600/20 to-transparent" />
    </section>
  );
}

export function DeviceBanner() {
  return (
    <section className="bg-gradient-to-br from-rose-50 via-white to-rose-100/40 py-14 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-5">
            <p className="section-subtitle text-rose-600">Featured Device</p>
            <h2 className="font-display text-4xl lg:text-5xl font-medium text-ink-900 leading-tight">
              Medicube
              <span className="block italic">Age-R Booster Pro</span>
            </h2>
            <p className="text-base text-ink-600 leading-relaxed max-w-md">
              Achieve your skin goals with innovative technology. Get your clear glow with the
              6-in-1 high-tech device, bringing a successful spa experience into your daily routine.
            </p>
            <Link
              href="/shop?category=devices"
              className="btn-primary inline-flex items-center gap-2 group"
            >
              Shop The Device
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-200/40 to-rose-400/20 blur-3xl rounded-full" />
            <div className="relative bg-gradient-to-br from-rose-100 to-white rounded-sm aspect-[4/3] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800&h=600&fit=crop"
                alt="High-tech beauty device"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute top-6 right-6 bg-rose-600 text-white px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider">
                6-IN-1 High-Tech
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
