import { connectDB } from "@/lib/mongodb";
import Brand from "@/models/Brand";
import BrandMarquee from "./BrandMarquee";
import type { Brand as BrandType } from "@/types";

async function getBrands(): Promise<BrandType[]> {
  try {
    await connectDB();
    const brands = await Brand.find({ active: true }).sort({ name: 1 }).lean();
    return JSON.parse(JSON.stringify(brands));
  } catch {
    return [];
  }
}

export default async function BrandSection() {
  const brands = await getBrands();

  return (
    <section className="py-14 lg:py-20 border-y border-ink-100 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-10 lg:mb-12">
        <p className="section-subtitle text-center text-rose-600 mb-2">Houses We Curate</p>
        <h2 className="section-title text-center">A Lineup of Cult Korean Labels</h2>
      </div>

      {brands.length > 0 ? (
        <BrandMarquee brands={brands} />
      ) : (
        <p className="text-center text-sm text-ink-400 py-4">
          No brands added yet.{" "}
          <a href="/admin/brands" className="text-rose-600 underline">Add brands in admin →</a>
        </p>
      )}
    </section>
  );
}
