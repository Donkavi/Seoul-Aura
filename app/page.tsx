import HeroBanner from "@/components/home/HeroBanner";
import ProductSection from "@/components/home/ProductSection";
import SkinConcerns from "@/components/home/SkinConcerns";
import ReviewCarousel from "@/components/home/ReviewCarousel";
import BrandSection from "@/components/home/BrandSection";
import TrustBadges from "@/components/home/TrustBadges";
import Newsletter from "@/components/home/Newsletter";
import VideoShowcase from "@/components/home/VideoShowcase";
import TrendingSection from "@/components/home/TrendingSection";
import PreOrderCTA from "@/components/home/PreOrderCTA";
import CommunityStats from "@/components/home/CommunityStats";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Settings from "@/models/Settings";
import type { Product as ProductType } from "@/types";

const DEFAULT_SECTION_ORDER = [
  "hero", "new-arrivals", "community-stats", "skin-concerns", "k-beauty",
  "video-showcase", "best-sellers", "hair-care", "trending", "pre-order",
  "brands", "trust-badges", "reviews", "newsletter",
];

interface SiteSettings {
  homeSections: { id: string; enabled: boolean; order: number }[];
  heroSlides: {
    url: string; type: "image" | "video"; label: string;
    badge: string; title: string; highlight: string;
    subtitle: string; description: string;
    cta: string; ctaHref: string; align: "left" | "right";
    showText: boolean; showButton: boolean;
  }[];
  marqueeItems: string[];
  sliderShowArrows: boolean;
  sliderShowDots: boolean;
}

async function getSettings(): Promise<SiteSettings> {
  const defaults: SiteSettings = {
    homeSections: DEFAULT_SECTION_ORDER.map((id, order) => ({ id, enabled: true, order })),
    heroSlides: [],
    marqueeItems: [],
    sliderShowArrows: true,
    sliderShowDots: true,
  };
  try {
    await connectDB();
    const s = await Settings.findOne().lean() as Partial<SiteSettings> | null;
    if (!s) return defaults;
    return {
      homeSections: s.homeSections?.length ? s.homeSections : defaults.homeSections,
      heroSlides: (s.heroSlides ?? []).map((sl) => ({
        ...sl,
        type: (sl.type === "video" ? "video" : "image") as "image" | "video",
        align: (sl.align === "right" ? "right" : "left") as "left" | "right",
      })),
      marqueeItems: s.marqueeItems ?? [],
      sliderShowArrows: s.sliderShowArrows ?? true,
      sliderShowDots: s.sliderShowDots ?? true,
    };
  } catch { return defaults; }
}

export const revalidate = 60;

async function getProducts(): Promise<{
  newArrivals: ProductType[];
  bestSellers: ProductType[];
  kBeauty: ProductType[];
  hairCare: ProductType[];
}> {
  try {
    await connectDB();
    const activeFilter = { active: { $ne: false } };

    // For each section: try the specific flag first, fall back to any active products
    const [rawNew, rawBest, rawKBeauty, rawHair, allActive] = await Promise.all([
      Product.find({ isNewArrival: true, ...activeFilter }).sort({ createdAt: -1 }).limit(5).lean(),
      Product.find({ isBestSeller: true, ...activeFilter }).limit(5).lean(),
      Product.find({ origin: "Korea", type: "Cosmetics", ...activeFilter }).limit(5).lean(),
      Product.find({ subtype: "Haircare", ...activeFilter }).limit(5).lean(),
      Product.find(activeFilter).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const serialize = (p: unknown[]): ProductType[] =>
      JSON.parse(JSON.stringify(p)) as ProductType[];

    const fallback = serialize(allActive);

    return {
      newArrivals: rawNew.length ? serialize(rawNew) : fallback.slice(0, 5),
      bestSellers: rawBest.length ? serialize(rawBest) : fallback.slice(0, 5),
      kBeauty: rawKBeauty.length ? serialize(rawKBeauty) : fallback.slice(0, 5),
      hairCare: rawHair.length ? serialize(rawHair) : fallback.slice(0, 5),
    };
  } catch {
    return { newArrivals: [], bestSellers: [], kBeauty: [], hairCare: [] };
  }
}

const sampleProducts: ProductType[] = [
  {
    _id: "s1",
    name: "Medicube PDRN Pink Vita Coating Mask · 1 Sheet Mask",
    slug: "medicube-pdrn-pink-vita-mask",
    description: "Brightening sheet mask infused with PDRN for radiant glass skin.",
    shortDescription: "Brightening sheet mask",
    price: 3950,
    origin: "Korea",
    type: "Cosmetics",
    subtype: "Skincare",
    images: ["https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=500&fit=crop"],
    stock: 24,
    tags: ["mask", "brightening"],
    concerns: ["Brightening"],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "s2",
    name: "ANUA Heartleaf Calming Daily Sun Water · 50ml",
    slug: "anua-heartleaf-sun-water",
    description: "Lightweight daily sunscreen with calming heartleaf extract.",
    shortDescription: "Calming daily sunscreen",
    price: 7400,
    origin: "Korea",
    type: "Cosmetics",
    subtype: "Skincare",
    images: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=500&fit=crop"],
    stock: 18,
    tags: ["sunscreen"],
    concerns: ["Sensitive Skin"],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: true,
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "s3",
    name: "ANUA Beta Glucan Barrier Booster Serum · 50ml",
    slug: "anua-beta-glucan-serum",
    description: "Strengthens the skin barrier with beta-glucan.",
    shortDescription: "Barrier booster serum",
    price: 8350,
    origin: "Korea",
    type: "Cosmetics",
    subtype: "Skincare",
    images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=500&fit=crop"],
    stock: 12,
    tags: ["serum"],
    concerns: ["Hydration"],
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: true,
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "s4",
    name: "ANUA Centella Green Fresh Cleansing Oil · 200ml",
    slug: "anua-centella-cleansing-oil",
    description: "Gentle cleansing oil that removes makeup and impurities.",
    shortDescription: "Centella cleansing oil",
    price: 7400,
    origin: "Korea",
    type: "Cosmetics",
    subtype: "Skincare",
    images: ["https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=400&h=500&fit=crop"],
    stock: 22,
    tags: ["cleanser"],
    concerns: [],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "s5",
    name: "Beauty of Joseon Glow Serum · 30ml",
    slug: "boj-glow-serum",
    description: "Brightening serum with propolis and niacinamide.",
    shortDescription: "Propolis glow serum",
    price: 6950,
    comparePrice: 7500,
    origin: "Korea",
    type: "Cosmetics",
    subtype: "Skincare",
    images: ["https://images.unsplash.com/photo-1631730486572-226d1f595b68?w=400&h=500&fit=crop"],
    stock: 30,
    tags: ["serum"],
    concerns: ["Brightening"],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: true,
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "s8",
    name: "Innisfree Volcanic Pore Clay Mask · 100ml",
    slug: "innisfree-clay-mask",
    description: "Deep cleansing clay mask with Jeju volcanic ash.",
    shortDescription: "Volcanic clay mask",
    price: 4850,
    origin: "Korea",
    type: "Cosmetics",
    subtype: "Skincare",
    images: ["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=500&fit=crop"],
    stock: 25,
    tags: ["mask", "clay"],
    concerns: ["Acne & Blemishes"],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "s9",
    name: "Mielle Rosemary Mint Scalp Strengthening Oil",
    slug: "mielle-rosemary-oil",
    description: "Strengthening hair oil with rosemary and mint.",
    shortDescription: "Strengthening hair oil",
    price: 8650,
    origin: "Korea",
    type: "Cosmetics",
    subtype: "Haircare",
    images: ["https://images.unsplash.com/photo-1626015449829-93761d4716c5?w=400&h=500&fit=crop"],
    stock: 19,
    tags: ["hair", "oil"],
    concerns: [],
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: true,
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "s10",
    name: "Curl Talk Defining Cream · 200ml",
    slug: "curl-talk-cream",
    description: "Defines and hydrates curls without crunch.",
    shortDescription: "Curl defining cream",
    price: 6250,
    origin: "Korea",
    type: "Cosmetics",
    subtype: "Haircare",
    images: ["https://images.unsplash.com/photo-1626015449829-93761d4716c5?w=400&h=500&fit=crop"],
    stock: 17,
    tags: ["hair", "curl"],
    concerns: [],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  },
];

export default async function HomePage() {
  const [{ newArrivals, bestSellers, kBeauty, hairCare }, settings] = await Promise.all([
    getProducts(),
    getSettings(),
  ]);
  const { homeSections: sections, heroSlides, marqueeItems, sliderShowArrows, sliderShowDots } = settings;

  const arrivals = newArrivals.length ? newArrivals : sampleProducts.slice(0, 5);
  const best = bestSellers.length ? bestSellers : sampleProducts.filter((p) => p.isBestSeller).slice(0, 5);
  const beauty = kBeauty.length ? kBeauty : sampleProducts.slice(0, 5);
  const hair = hairCare.length ? hairCare : sampleProducts.filter((p) => p.subtype === "Haircare");

  const renderSection = (id: string) => {
    switch (id) {
      case "hero":           return <HeroBanner key={id} heroSlides={heroSlides} marqueeItems={marqueeItems} showArrows={sliderShowArrows} showDots={sliderShowDots} />;
      case "new-arrivals":   return <ProductSection key={id} title="New Arrivals" subtitle="Freshly Imported" viewAllHref="/shop?filter=new" products={arrivals} />;
      case "community-stats": return <CommunityStats key={id} />;
      case "skin-concerns":  return <SkinConcerns key={id} />;
      case "k-beauty":       return <ProductSection key={id} title="Best of K-Beauty" subtitle="Top Picks from Seoul" viewAllHref="/shop?origin=Korea" products={beauty} />;
      case "video-showcase": return <VideoShowcase key={id} />;
      case "best-sellers":   return <ProductSection key={id} title="Best Sellers" subtitle="Customer Favorites" viewAllHref="/shop?filter=bestseller" products={best} />;
      case "hair-care":      return <ProductSection key={id} title="Hair Care" subtitle="Nourish & Strengthen" viewAllHref="/shop?subtype=Haircare" products={hair} />;
      case "trending":       return <TrendingSection key={id} />;
      case "pre-order":      return <PreOrderCTA key={id} />;
      case "brands":         return <BrandSection key={id} />;
      case "trust-badges":   return <TrustBadges key={id} />;
      case "reviews":        return <ReviewCarousel key={id} />;
      case "newsletter":     return <Newsletter key={id} />;
      default:               return null;
    }
  };

  const orderedSections = [...sections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  return <>{orderedSections.map((s) => renderSection(s.id))}</>;
}
