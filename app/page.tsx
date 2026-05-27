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
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import type { Product as ProductType } from "@/types";

export const revalidate = 60;

async function getProducts(): Promise<{
  newArrivals: ProductType[];
  bestSellers: ProductType[];
  kBeauty: ProductType[];
  hairCare: ProductType[];
}> {
  try {
    await connectDB();
    const [newArrivals, bestSellers, kBeauty, hairCare] = await Promise.all([
      Product.find({ isNewArrival: true }).sort({ createdAt: -1 }).limit(5).lean(),
      Product.find({ isBestSeller: true }).limit(5).lean(),
      Product.find({ origin: "Korea", type: "Cosmetics" }).limit(5).lean(),
      Product.find({ subtype: "Haircare" }).limit(5).lean(),
    ]);

    const serialize = (p: unknown[]): ProductType[] =>
      JSON.parse(JSON.stringify(p)) as ProductType[];

    return {
      newArrivals: serialize(newArrivals),
      bestSellers: serialize(bestSellers),
      kBeauty: serialize(kBeauty),
      hairCare: serialize(hairCare),
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
    averageRating: 4.7,
    reviewCount: 38,
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
    averageRating: 4.9,
    reviewCount: 142,
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
    averageRating: 4.8,
    reviewCount: 89,
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
    averageRating: 4.6,
    reviewCount: 156,
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
    averageRating: 4.9,
    reviewCount: 211,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "s6",
    name: "Bateel Premium Date Selection · Dubai Gift Box",
    slug: "bateel-premium-dates",
    description: "Hand-selected premium dates from Dubai.",
    shortDescription: "Premium dates gift box",
    price: 12500,
    origin: "Dubai",
    type: "Food",
    subtype: "Snacks",
    images: ["https://images.unsplash.com/photo-1601493700518-4f9f5a8fcb3a?w=400&h=500&fit=crop"],
    stock: 8,
    tags: ["dates", "gift"],
    concerns: [],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    averageRating: 5.0,
    reviewCount: 47,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "s7",
    name: "Patchi Mixed Chocolate Selection · 250g",
    slug: "patchi-chocolate-mix",
    description: "Luxury Dubai-imported chocolate assortment.",
    shortDescription: "Mixed chocolate box",
    price: 8950,
    origin: "Dubai",
    type: "Food",
    subtype: "Snacks",
    images: ["https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=500&fit=crop"],
    stock: 14,
    tags: ["chocolate"],
    concerns: [],
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: true,
    averageRating: 4.8,
    reviewCount: 63,
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
    averageRating: 4.5,
    reviewCount: 92,
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
    averageRating: 4.7,
    reviewCount: 178,
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
    averageRating: 4.6,
    reviewCount: 56,
    createdAt: new Date().toISOString(),
  },
];

export default async function HomePage() {
  const { newArrivals, bestSellers, kBeauty, hairCare } = await getProducts();

  const arrivals = newArrivals.length ? newArrivals : sampleProducts.slice(0, 5);
  const best = bestSellers.length ? bestSellers : sampleProducts.filter((p) => p.isBestSeller).slice(0, 5);
  const beauty = kBeauty.length ? kBeauty : sampleProducts.slice(0, 5);
  const hair = hairCare.length ? hairCare : sampleProducts.filter((p) => p.subtype === "Haircare");

  return (
    <>
      <HeroBanner />

      <ProductSection
        title="New Arrivals"
        subtitle="Freshly Imported"
        viewAllHref="/shop?filter=new"
        products={arrivals}
      />

      <SkinConcerns />

      <ProductSection
        title="Best of K-Beauty"
        subtitle="Top Picks from Seoul"
        viewAllHref="/shop?origin=Korea"
        products={beauty}
      />

      <VideoShowcase />

      <ProductSection
        title="Best Sellers"
        subtitle="Customer Favorites"
        viewAllHref="/shop?filter=bestseller"
        products={best}
      />

      <ProductSection
        title="Hair Care"
        subtitle="Nourish & Strengthen"
        viewAllHref="/shop?subtype=Haircare"
        products={hair}
      />

      <TrendingSection />

      <PreOrderCTA />

      <BrandSection />

      <TrustBadges />

      <ReviewCarousel />

      <Newsletter />
    </>
  );
}
