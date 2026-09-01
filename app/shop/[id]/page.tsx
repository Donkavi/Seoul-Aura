import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import ProductModel from "@/models/Product";
import Settings from "@/models/Settings";
import ReviewSection from "@/components/product/ReviewSection";
import ProductView from "./ProductView";
import RecentlyViewed from "./RecentlyViewed";
import type { Product } from "@/types";
import { SITE_URL } from "@/lib/seo";

async function getProduct(id: string): Promise<Product | null> {
  try {
    await connectDB();
    const product = await ProductModel.findOne({
      $or: [{ slug: id }, ...(id.length === 24 ? [{ _id: id }] : [])],
    }).lean();
    if (!product) return null;
    return JSON.parse(JSON.stringify(product));
  } catch {
    return null;
  }
}

const DEFAULT_BADGES = [
  { icon: "truck", text: "Delivery Charge LKR 350", enabled: true },
  { icon: "shield", text: "Guaranteed 100% Authentic Products", enabled: true },
  { icon: "globe", text: "Imported From {origin}", enabled: true },
  { icon: "lock", text: "Secure Payments", enabled: true },
];

const DEFAULT_ACCORDIONS = [
  {
    label: "Shipping Information",
    content:
      "Free islandwide shipping on orders above Rs. 5,000.\nStandard delivery: 3-5 business days · Express: 1-2 business days.\nSame-day delivery available within Colombo for orders placed before 12 PM.",
    enabled: true,
  },
  {
    label: "Ask a Question",
    content:
      "Have a question? Reach out via WhatsApp or email:\n📱 074 166 7016 · ✉️ seoulaurateam@gmail.com\nWe reply within 24 hours, Mon–Sat.",
    enabled: true,
  },
];

async function getProductPageSettings(): Promise<{
  showMintpay: boolean;
  showKoko: boolean;
  productBadges: { icon: string; text: string; enabled: boolean }[];
  productAccordions: { label: string; content: string; enabled: boolean }[];
}> {
  try {
    await connectDB();
    const s = await Settings.findOne().lean() as {
      showMintpay?: boolean;
      showKoko?: boolean;
      productBadges?: { icon: string; text: string; enabled: boolean }[];
      productAccordions?: { label: string; content: string; enabled: boolean }[];
    } | null;
    return {
      showMintpay: s?.showMintpay ?? true,
      showKoko: s?.showKoko ?? true,
      productBadges: s?.productBadges?.length ? s.productBadges : DEFAULT_BADGES,
      productAccordions: s?.productAccordions?.length ? s.productAccordions : DEFAULT_ACCORDIONS,
    };
  } catch {
    return { showMintpay: true, showKoko: true, productBadges: DEFAULT_BADGES, productAccordions: DEFAULT_ACCORDIONS };
  }
}

async function getRelated(product: Product): Promise<Product[]> {
  try {
    await connectDB();
    const related = await ProductModel.find({
      _id: { $ne: product._id },
      $or: [{ type: product.type }, { subtype: product.subtype }, { origin: product.origin }],
    })
      .limit(5)
      .lean();
    return JSON.parse(JSON.stringify(related));
  } catch {
    return [];
  }
}

const sampleProduct: Product = {
  _id: "demo",
  name: "Curl Talk Defining Cream",
  slug: "demo",
  description:
    "Want definition for your curls at their every twist and turn? Curl Talk Defining Cream is your answer to achieving clearly defined curls and added bounce within your day-to-day styling routine. Along with maximum definition, it seals in moisture, manages frizz and adds shine.",
  shortDescription: "Defining cream for clear, bouncy curls.",
  price: 6250,
  origin: "Korea",
  type: "Cosmetics",
  subtype: "Haircare",
  images: [
    "https://images.unsplash.com/photo-1626015449829-93761d4716c5?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1573461160327-b450ce3d8e7f?w=400&h=400&fit=crop",
  ],
  stock: 4,
  tags: ["hair", "curl"],
  concerns: [],
  isFeatured: false,
  isBestSeller: true,
  isNewArrival: true,
  averageRating: 0,
  reviewCount: 0,
  createdAt: new Date().toISOString(),
};

/**
 * Per-product title, description and share image.
 *
 * Without this every product page inherited the site-wide title, so Google saw
 * 40+ pages all called "Seoul Aura | Premium Korean Imports" with the same
 * description — nothing to distinguish them, and nothing matching what someone
 * actually searches for ("beauty of joseon glow serum sri lanka").
 */
/**
 * "Dr.Althea" + "Dr.Althea 345 Relief Cream" would read as the brand twice. Most
 * product names in this catalogue already lead with the brand, so only prefix it
 * when it is genuinely missing.
 */
function withBrand(name: string, brand?: string): string {
  if (!brand?.trim()) return name;
  const normalise = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalise(name).startsWith(normalise(brand)) ? name : `${brand.trim()} ${name}`;
}

/** Trims to a word boundary so a description never ends mid-word. */
function clamp(text: string, limit: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, "")}…`;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(params.id);
  if (!product) return { title: "Product not found" };

  const title = withBrand(product.name, product.brand);
  // Prefer the hand-written short description; fall back to the long one, whose
  // newlines and bullet glyphs need flattening before it can serve as meta text.
  const source = product.shortDescription?.trim() || product.description?.trim() || "";
  const description =
    clamp(source, 155) ||
    `Buy ${title} in Sri Lanka. 100% authentic, imported from Korea, delivered islandwide.`;

  const canonical = `/shop/${product.slug ?? product._id}`;
  const image = product.images?.[0];

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | Seoul Aura`,
      description,
      type: "website",
      url: canonical,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

/**
 * Product schema for rich results — the price, stock state and star rating that
 * appear under a listing in Google. Emitted as JSON-LD because that is the only
 * format Google documents as supported for Product.
 */
function productJsonLd(product: Product, siteUrl: string) {
  const url = `${siteUrl}/shop/${product.slug ?? product._id}`;
  const inStock = product.stock > 0 || product.isPreOrder;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: clamp(product.shortDescription || product.description || "", 500),
    image: product.images?.length ? product.images : undefined,
    sku: product._id,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "LKR",
      price: product.price,
      availability: inStock
        ? product.isPreOrder && product.stock === 0
          ? "https://schema.org/PreOrder"
          : "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Seoul Aura" },
    },
    // Only claim a rating when real reviews back it — a fabricated
    // aggregateRating is a manual-action risk, not a shortcut to stars.
    ...(product.reviewCount > 0 && product.averageRating > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating.toFixed(1),
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const fetched = await getProduct(params.id);
  const product = fetched ?? (params.id === "demo" ? sampleProduct : null);

  if (!product) notFound();

  const [related, productPageSettings] = await Promise.all([
    fetched ? getRelated(fetched) : Promise.resolve([]),
    getProductPageSettings(),
  ]);

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        // Server-rendered constant built from our own database, so there is no
        // untrusted input reaching this tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, SITE_URL)) }}
      />
      <nav className="max-w-7xl mx-auto px-4 lg:px-8 py-4 text-xs text-ink-500 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-rose-600">Home</Link>
        <ChevronRight size={12} />
        <Link href="/shop" className="hover:text-rose-600">Shop</Link>
        <ChevronRight size={12} />
        <Link href={`/shop?type=${product.type}`} className="hover:text-rose-600">{product.type}</Link>
        <ChevronRight size={12} />
        <span className="text-ink-900 truncate">{product.name}</span>
      </nav>

      <ProductView
        product={product}
        related={related}
        showMintpay={productPageSettings.showMintpay}
        showKoko={productPageSettings.showKoko}
        productBadges={productPageSettings.productBadges}
        productAccordions={productPageSettings.productAccordions}
      />

      <ReviewSection
        productId={product._id}
        initialAverage={product.averageRating}
        initialCount={product.reviewCount}
      />

      <RecentlyViewed currentProductId={product._id} />
    </div>
  );
}
