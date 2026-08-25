import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/Review";
// Required: .populate("productId") resolves the "Product" model by name, and in a
// serverless instance nothing else imports it — without this the populate throws
// MissingSchemaError. Do not remove even though it looks unused.
import "@/models/Product";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const approved = searchParams.get("approved");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const top = searchParams.get("top");
    const general = searchParams.get("general");

    // Homepage slider feed: every approved review qualifies — admin moderation is
    // the only gate — with the best-received ones surfaced first.
    if (top === "true") {
      const feed = Review.find({ isApproved: true })
        .sort({ helpfulVotes: -1, rating: -1, createdAt: -1 })
        .limit(limit);

      // The product link is a nice-to-have; never fail the whole slider over it.
      const reviews = await feed
        .clone()
        .populate("productId", "name slug images")
        .lean()
        .catch(async (err) => {
          console.error("[/api/reviews] populate failed, serving unpopulated:", err);
          return feed.lean();
        });

      return NextResponse.json(reviews);
    }

    const query: Record<string, unknown> = {};
    if (productId) query.productId = productId;
    if (general === "true") query.productId = { $exists: false };
    if (approved === "true") query.isApproved = true;
    if (approved === "false") query.isApproved = false;

    const reviews = await Review.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    return NextResponse.json(reviews);
  } catch (err) {
    console.error("[app/api/reviews/route.ts]", err);
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

    // Photos are uploaded to Cloudinary from the browser, so only URLs arrive here.
    // Older cached clients may still post base64 data URLs — reject those with a
    // clear message rather than storing megabytes per document.
    const submittedImages: string[] = Array.isArray(images)
      ? images.filter((img: unknown): img is string => typeof img === "string" && img.length > 0)
      : [];
    if (submittedImages.some((img) => img.startsWith("data:"))) {
      return NextResponse.json(
        { error: "Please refresh the page and re-attach your photos." },
        { status: 400 }
      );
    }
    const reviewImages = submittedImages
      .filter((img) => /^https?:\/\//i.test(img) && img.length <= 2048)
      .slice(0, 6);

    const review = await Review.create({
      productId: productId || undefined,
      userName,
      userEmail,
      rating: numericRating,
      title,
      comment,
      images: reviewImages,
      isApproved: false,
      isVerifiedBuyer: false,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error("[app/api/reviews/route.ts]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
