import Link from "next/link";
import Image from "next/image";

const trending = [
  {
    title: "VT Cosmetics Reedle Shot",
    description:
      "Our V7 Cosmetics Reedle Shot 100 offers an at-home micro needling experience for smoother skin.",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop",
    href: "/shop?tag=trending",
  },
  {
    title: "Blush Beauty Essentials",
    description:
      "Unleash your beauty with our top-notch products at unbeatable prices — perfect for every routine.",
    image: "https://images.unsplash.com/photo-1599733589046-833caccbbd03?w=600&h=600&fit=crop",
    href: "/shop?type=Cosmetics",
  },
  {
    title: "Sunscreen Glossary",
    description:
      "Helping you find the only SPF you want to wear. Every single day. Click the button below to discover our wide range of sunscreens.",
    image: "https://images.unsplash.com/photo-1556228841-7d0e75a23d5d?w=600&h=600&fit=crop",
    href: "/shop?subtype=Sunscreen",
  },
];

export default function TrendingSection() {
  return (
    <section className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <h2 className="font-display text-3xl lg:text-4xl text-center text-ink-900 italic mb-12">
          NEW & TRENDING
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trending.map((item) => (
            <Link key={item.title} href={item.href} className="group block">
              <div className="relative aspect-[4/5] bg-rose-50 rounded-sm overflow-hidden mb-4">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <h3 className="font-display text-2xl text-ink-900 mb-2 group-hover:text-rose-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-ink-500 leading-relaxed mb-3">{item.description}</p>
              <span className="inline-block text-xs uppercase tracking-widest text-rose-600 font-semibold border border-rose-600 px-4 py-2 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                Shop Now
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
