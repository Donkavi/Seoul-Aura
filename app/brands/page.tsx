import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import BrandModel from "@/models/Brand";
import ProductModel from "@/models/Product";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import type { Brand } from "@/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Korean Skincare Brands in Sri Lanka — All Brands",
  description:
    "Every K-Beauty brand we stock in Sri Lanka — COSRX, Beauty of Joseon, SKIN1004, Anua, AXIS-Y and more. 100% authentic, imported from Seoul, delivered islandwide.",
  alternates: { canonical: "/brands" },
  openGraph: {
    title: "Korean Skincare Brands in Sri Lanka",
    description:
      "Browse every authentic K-Beauty brand stocked at Seoul Aura, delivered islandwide across Sri Lanka.",
    url: "/brands",
    type: "website",
  },
};

interface BrandCard extends Brand {
  productCount: number;
}

/**
 * Brands with their live product counts.
 *
 * Counted per brand name rather than by a stored field so the number can never
 * drift from what the brand page actually lists.
 */
async function getBrands(): Promise<BrandCard[]> {
  try {
    await connectDB();

    const [docs, counts] = await Promise.all([
      BrandModel.find({ active: true }).sort({ name: 1 }).lean(),
      ProductModel.aggregate<{ _id: string; count: number }>([
        { $match: { active: true, brand: { $nin: [null, ""] } } },
        { $group: { _id: { $toLower: "$brand" }, count: { $sum: 1 } } },
      ]),
    ]);

    const byName = new Map(counts.map((c) => [c._id, c.count]));

    return (JSON.parse(JSON.stringify(docs)) as Brand[])
      .map((b) => ({ ...b, productCount: byName.get(b.name.toLowerCase()) ?? 0 }))
      // A brand page with nothing on it is a thin page; leave those out of the hub.
      .filter((b) => b.productCount > 0);
  } catch {
    return [];
  }
}

export default async function BrandsPage() {
  const brands = await getBrands();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Korean Skincare Brands in Sri Lanka — ${SITE_NAME}`,
    url: `${SITE_URL}/brands`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: brands.length,
      itemListElement: brands.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        url: `${SITE_URL}/brands/${b.slug}`,
      })),
    },
  };

  return (
    <div className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-ink-100 bg-rose-25/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
          <nav className="text-xs text-ink-500 flex items-center gap-2 mb-5">
            <Link href="/" className="hover:text-rose-600">Home</Link>
            <span>/</span>
            <span className="text-ink-900">Brands</span>
          </nav>
          <h1 className="font-display text-3xl lg:text-4xl text-ink-900 tracking-tight">
            Korean Skincare Brands in Sri Lanka
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-14">
        {brands.length === 0 ? (
          <p className="text-sm text-ink-500">No brands to show yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {brands.map((b) => (
              <Link
                key={b._id}
                href={`/brands/${b.slug}`}
                className="group border border-ink-100 rounded-sm p-5 hover:border-rose-300 transition-colors flex flex-col"
              >
                <div className="h-16 flex items-center justify-center mb-4">
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.logo}
                      alt={`${b.name} logo`}
                      loading="lazy"
                      className="max-h-14 w-auto object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                    />
                  ) : (
                    <span className="font-display text-2xl text-ink-700 group-hover:text-rose-600 transition-colors text-center">
                      {b.name}
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-medium text-ink-900">{b.name}</h2>
                <p className="text-xs text-ink-500 mt-0.5">
                  {b.productCount} {b.productCount === 1 ? "product" : "products"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
