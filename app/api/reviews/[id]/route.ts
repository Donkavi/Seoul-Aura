import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/Review";
import Product from "@/models/Product";

async function recalcRating(productId: string) {
  const reviews = await Review.find({ productId, isApproved: true });
  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;
  await Product.findByIdAndUpdate(productId, {
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await req.json();
    const review = await Review.findByIdAndUpdate(params.id, body, { new: true });
    if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await recalcRating(review.productId.toString());
    return NextResponse.json(review);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const review = await Review.findByIdAndDelete(params.id);
    if (review) await recalcRating(review.productId.toString());
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
