import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Concern from "@/models/Concern";
import SkinConcernsSlider from "./SkinConcernsSlider";

async function getConcerns() {
  try {
    await connectDB();
    const concerns = await Concern.find().sort({ order: 1, name: 1 }).lean();
    return concerns as unknown as Array<{
      _id: string;
      name: string;
      slug: string;
      image?: string;
    }>;
  } catch {
    return [];
  }
}

export default async function SkinConcerns() {
  const concerns = await getConcerns();

  if (concerns.length === 0) return null;

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

        <SkinConcernsSlider concerns={concerns} />
      </div>
    </section>
  );
}
