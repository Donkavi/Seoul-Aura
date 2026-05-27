import Link from "next/link";
import Image from "next/image";

const concerns = [
  {
    label: "Acne",
    image: "https://images.unsplash.com/photo-1614108233022-9a44b8edcd6f?w=400&h=400&fit=crop",
    slug: "acne",
  },
  {
    label: "Anti-Aging",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop",
    slug: "anti-aging",
  },
  {
    label: "Pigmentation",
    image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=400&fit=crop",
    slug: "pigmentation",
  },
  {
    label: "Brightening",
    image: "https://images.unsplash.com/photo-1573461160327-b450ce3d8e7f?w=400&h=400&fit=crop",
    slug: "brightening",
  },
  {
    label: "Dark Circles",
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop",
    slug: "dark-circles",
  },
  {
    label: "Pores",
    image: "https://images.unsplash.com/photo-1631730486572-226d1f595b68?w=400&h=400&fit=crop",
    slug: "pores",
  },
];

export default function SkinConcerns() {
  return (
    <section className="py-14 lg:py-20 bg-rose-25">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-subtitle text-rose-600 mb-2">Personalized for you</p>
            <h2 className="section-title">Shop by Skin Concern</h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:block text-sm font-medium text-ink-700 hover:text-rose-600"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-5">
          {concerns.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?concern=${c.slug}`}
              className="group relative aspect-square rounded-full overflow-hidden block"
            >
              <Image
                src={c.image}
                alt={c.label}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                sizes="(max-width: 768px) 33vw, 16vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-4 text-center">
                <p className="font-display text-base lg:text-xl text-white font-medium drop-shadow">
                  {c.label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
