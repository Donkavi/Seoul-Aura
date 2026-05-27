import { ShieldCheck, Truck, CreditCard, Award } from "lucide-react";

const badges = [
  {
    icon: ShieldCheck,
    title: "100% Authentic",
    description: "Direct imports from trusted Korean & Dubai suppliers",
  },
  {
    icon: Truck,
    title: "Islandwide Delivery",
    description: "Fast, secure delivery within 3-5 business days",
  },
  {
    icon: CreditCard,
    title: "Easy Payment Options",
    description: "Card, bank transfer, KOKO and Cash on Delivery",
  },
  {
    icon: Award,
    title: "Trusted Online Store",
    description: "Joined by 10,000+ happy customers since 2020",
  },
];

export default function TrustBadges() {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
          {badges.map((b) => (
            <div key={b.title} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors duration-300">
                <b.icon size={24} className="text-rose-600" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-lg text-ink-900 mb-1">{b.title}</h3>
              <p className="text-xs text-ink-500 leading-relaxed px-2">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
