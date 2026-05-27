import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import ProductModel from "@/models/Product";
import ReviewSection from "@/components/product/ReviewSection";
import ProductView from "./ProductView";
import RecentlyViewed from "./RecentlyViewed";
import type { Product } from "@/types";

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
  isFeatured: false,
  isBestSeller: true,
  isNewArrival: true,
  averageRating: 5.0,
  reviewCount: 1,
  createdAt: new Date().toISOString(),
};

export default async function ProductPage({ params }: { params: { id: string } }) {
  const fetched = await getProduct(params.id);
  const product = fetched ?? (params.id === "demo" ? sampleProduct : null);

  if (!product) notFound();

  const related = fetched ? await getRelated(fetched) : [];

  return (
    <div className="bg-white">
      <nav className="max-w-7xl mx-auto px-4 lg:px-8 py-4 text-xs text-ink-500 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-rose-600">Home</Link>
        <ChevronRight size={12} />
        <Link href="/shop" className="hover:text-rose-600">Shop</Link>
        <ChevronRight size={12} />
        <Link href={`/shop?type=${product.type}`} className="hover:text-rose-600">{product.type}</Link>
        <ChevronRight size={12} />
        <span className="text-ink-900 truncate">{product.name}</span>
      </nav>

      <ProductView product={product} related={related} />

      <ReviewSection
        productId={product._id}
        initialAverage={product.averageRating}
        initialCount={product.reviewCount}
      />

      <RecentlyViewed currentProductId={product._id} />
    </div>
  );
}
