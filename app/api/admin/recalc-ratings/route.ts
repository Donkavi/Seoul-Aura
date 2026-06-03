import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Review from "@/models/Review";

export async function POST() {
  try {
    await connectDB();
    const products = await Product.find({}).select("_id").lean();

    let updated = 0;
    await Promise.all(
      products.map(async (p) => {
        const reviews = await Review.find({ productId: p._id, isApproved: true }).select("rating").lean();
        const count = reviews.length;
        const avg = count
          ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
          : 0;
        await Product.findByIdAndUpdate(p._id, { averageRating: avg, reviewCount: count });
        updated++;
      })
    );

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
