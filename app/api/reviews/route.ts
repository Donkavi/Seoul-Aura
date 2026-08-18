import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/Review";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const approved = searchParams.get("approved");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const top = searchParams.get("top");
    const general = searchParams.get("general");

    if (top === "true") {
      const reviews = await Review.find({ isApproved: true, rating: { $gte: 4 } })
        .sort({ helpfulVotes: -1, rating: -1, createdAt: -1 })
        .limit(limit)
        .populate("productId", "name slug images")
        .lean();
      return NextResponse.json(reviews);
    }

    const query: Record<string, unknown> = {};
    if (productId) query.productId = productId;
    if (general === "true") query.productId = { $exists: false };
    if (approved === "true") query.isApproved = true;
    if (approved === "false") query.isApproved = false;

    const reviews = await Review.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { productId, userName, rating, title, comment, userEmail, images } = body;

    if (!userName || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ratings may be fractional (e.g. 4.7) — keep one decimal so stored values stay clean.
    const numericRating = Math.round(Number(rating) * 10) / 10;
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const review = await Review.create({
      productId: productId || undefined,
      userName,
      userEmail,
      rating: numericRating,
      title,
      comment,
      images: Array.isArray(images) ? images.filter(Boolean).slice(0, 6) : [],
      isApproved: false,
      isVerifiedBuyer: false,
    });

    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
