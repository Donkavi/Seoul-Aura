import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const subtype = searchParams.get("subtype");
    const origin = searchParams.get("origin");
    const featured = searchParams.get("featured");
    const bestSeller = searchParams.get("bestSeller");
    const newArrival = searchParams.get("newArrival");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const page = parseInt(searchParams.get("page") ?? "1");
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    const concern = searchParams.get("concern");
    const brand = searchParams.get("brand");

    const adminView = searchParams.get("admin") === "true";
    const query: Record<string, unknown> = {};
    // Only show active products in the shop; admin view sees all
    if (!adminView) query.active = true;
    if (type) query.type = type;
    if (subtype) query.subtype = subtype;
    if (origin) query.origin = origin;
    if (featured === "true") query.isFeatured = true;
    if (bestSeller === "true") query.isBestSeller = true;
    if (newArrival === "true") query.isNewArrival = true;
    if (search) {
      const rx = { $regex: search, $options: "i" };
      query.$or = [
        { name: rx },
        { brand: rx },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }
    if (tag) query.tags = { $in: [new RegExp(tag, "i")] };
    if (concern) query.concerns = { $in: [new RegExp(concern, "i")] };
    // brand=all → no brand filter (show everything); brand=X → filter by brand field
    if (brand && brand !== "all") query.brand = { $regex: `^${brand}$`, $options: "i" };

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const slug = slugify(body.name);
    const product = await Product.create({ ...body, slug });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
