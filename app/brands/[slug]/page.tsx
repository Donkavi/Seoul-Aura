import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import BrandModel from "@/models/Brand";
import ProductModel from "@/models/Product";
import ShopClient from "@/app/shop/ShopClient";
import { slugify } from "@/lib/utils";
import { SITE_URL, SITE_NAME, brandSeo } from "@/lib/seo";
import type { Brand, Product } from "@/types";

/** Brand pages change when the catalogue does, not when we deploy. */
export const revalidate = 3600;

interface BrandPageData {
  brand: Brand;
  products: Product[];
}

/**
 * Resolves a URL slug to a brand.
 *
 * The Brand collection is the source of truth, but products carry the brand as
 * a plain name string, and a product can name a brand that was never added to
 * that collection. Falling back to the distinct product brands means such a
 * page still resolves instead of 404ing on a brand we demonstrably stock.
 */
async function getBrandPage(slug: string): Promise<BrandPageData | null> {
  try {
    await connectDB();

    const doc = await BrandModel.findOne({ slug: slug.toLowerCase() }).lean();
    let brand = doc ? (JSON.parse(JSON.stringify(doc)) as Brand) : null;

    if (!brand) {
      const names = (await ProductModel.distinct("brand", { active: true })) as string[];
      const match = names.find((n) => n && slugify(n) === slug.toLowerCase());
      if (!match) return null;
      brand = { _id: slugify(match), name: match, slug: slugify(match), origin: "Korea", active: true };
    }

    const products = await ProductModel.find({
      active: true,
      // Brand names are stored as typed, so the case-insensitive collation below
      // keeps "Anua" and "ANUA" on the same shelf.
      brand: brand.name,
    })
      .collation({ locale: "en", strength: 2 })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(100)
      .lean();

    return { brand, products: JSON.parse(JSON.stringify(products)) };
  } catch {
    return null;
  }
}

/** Pre-renders the brands we know about; anything else is generated on demand. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    await connectDB();
    const brands = await BrandModel.find({ active: true }).select("slug").lean();
    return (brands as unknown as { slug: string }[]).map((b) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getBrandPage(params.slug);
  if (!data) return { title: "Brand not found", robots: { index: false, follow: true } };

  const { title, description } = brandSeo(data.brand);
  const canonical = `/brands/${data.brand.slug}`;

  return {
    title,
    description,
    keywords: [
      `${data.brand.name} sri lanka`,
      `buy ${data.brand.name} online`,
      `${data.brand.name} colombo`,
      `authentic ${data.brand.name}`,
    ],
    alternates: { canonical },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: "website",
      url: canonical,
      images: data.brand.logo
        ? [{ url: data.brand.logo, alt: `${data.brand.name} logo` }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: data.brand.logo ? [data.brand.logo] : undefined,
    },
  };
}

/**
 * Brand + breadcrumb + product list, as JSON-LD.
 *
 * The ItemList is what lets Google see this as a collection of specific
 * products rather than a page that happens to mention a brand name.
 */
function brandJsonLd(brand: Brand, products: Product[], description: string) {
  const url = `${SITE_URL}/brands/${brand.slug}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${brand.name} — ${SITE_NAME}`,
      description,
      url,
      about: {
        "@type": "Brand",
        name: brand.name,
        ...(brand.logo ? { logo: brand.logo } : {}),
        ...(brand.description ? { description: brand.description } : {}),
      },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: products.length,
        itemListElement: products.slice(0, 30).map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}/shop/${p.slug ?? p._id}`,
          name: p.name,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Brands", item: `${SITE_URL}/brands` },
        { "@type": "ListItem", position: 3, name: brand.name, item: url },
      ],
    },
  ];
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const data = await getBrandPage(params.slug);
  if (!data) notFound();

  const { brand, products } = data;
  const { description } = brandSeo(brand);

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        // Built server-side from our own collections — no untrusted input here.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(brandJsonLd(brand, products, description)),
        }}
      />

      {/* Heading block: the brand, its logo and how many products we hold. The
          SEO description is not repeated here — it lives in the head and in the
          JSON-LD above, which is where a crawler reads it from. */}
      <header className="border-b border-ink-100 bg-rose-25/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
          <nav className="text-xs text-ink-500 flex items-center gap-2 mb-5">
            <Link href="/" className="hover:text-rose-600">Home</Link>
            <ChevronRight size={12} />
            <Link href="/brands" className="hover:text-rose-600">Brands</Link>
            <ChevronRight size={12} />
            <span className="text-ink-900">{brand.name}</span>
          </nav>

          <div className="flex items-center gap-5">
            {brand.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logo}
                alt={`${brand.name} logo`}
                className="h-14 lg:h-16 w-auto object-contain flex-shrink-0"
              />
            )}
            <div>
              <h1 className="font-display text-3xl lg:text-4xl text-ink-900 tracking-tight">
                {brand.name}
              </h1>
              <p className="text-sm text-ink-500 mt-1">
                {products.length} {products.length === 1 ? "product" : "products"}
                {brand.origin ? ` · ${brand.origin}` : ""}
              </p>
            </div>
          </div>

        </div>
      </header>

      <ShopClient brand={brand.name} initialProducts={products} showHeader={false} />
    </div>
  );
}
