import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import StockNotification from "@/models/StockNotification";
import Product from "@/models/Product";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "100");

    const query: Record<string, unknown> = {};
    if (productId) query.productId = productId;
    if (status) query.status = status;

    const subs = await StockNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(subs);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { productId, email, name } = await req.json();

    if (!productId || !email?.trim()) {
      return NextResponse.json({ error: "Product and email are required" }, { status: 400 });
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    try {
      const sub = await StockNotification.create({
        productId,
        productName: (product as { name: string }).name,
        email: email.trim().toLowerCase(),
        name: name?.trim(),
      });
      return NextResponse.json(sub, { status: 201 });
    } catch (e) {
      const err = e as { code?: number };
      if (err.code === 11000) {
        return NextResponse.json(
          { error: "You're already on the waitlist for this product", duplicate: true },
          { status: 200 }
        );
      }
      throw e;
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
