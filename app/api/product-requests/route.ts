import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ProductRequest from "@/models/ProductRequest";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    if (searchParams.get("counts") === "true") {
      const result = await ProductRequest.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      const counts: Record<string, number> = {};
      result.forEach((r: { _id: string; count: number }) => {
        counts[r._id] = r.count;
      });
      return NextResponse.json({ counts });
    }

    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "100");
    const page = parseInt(searchParams.get("page") ?? "1");

    const query: Record<string, unknown> = {};
    if (status && status !== "all") query.status = status;
    if (search) {
      const rx = { $regex: search, $options: "i" };
      query.$or = [
        { productName: rx },
        { brand: rx },
        { concern: rx },
        { customerEmail: rx },
        { customerName: rx },
      ];
    }

    const skip = (page - 1) * limit;
    const [requests, total] = await Promise.all([
      ProductRequest.find(query)
        .sort({ status: 1, requestCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductRequest.countDocuments(query),
    ]);

    return NextResponse.json({ requests, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const productName = String(body.productName ?? "").trim();
    if (!productName) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const brand = String(body.brand ?? "").trim();
    const images = Array.isArray(body.images)
      ? body.images.filter((u: unknown) => typeof u === "string" && u.startsWith("https://")).slice(0, 4)
      : [];
    const email = String(body.customerEmail ?? "").trim().toLowerCase();

    // The same product asked for twice is demand signal, not two rows — bump the
    // counter on the open request instead so admins see what to source first.
    const existing = await ProductRequest.findOne({
      productName: { $regex: `^${productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      brand: brand || "",
      status: { $in: ["pending", "sourcing"] },
    });

    if (existing) {
      existing.requestCount += 1;
      // A second shopper may have supplied the photo the first one did not.
      if (images.length) {
        existing.images = Array.from(new Set([...(existing.images ?? []), ...images])).slice(0, 4);
      }
      if (email && existing.customerEmail !== email) {
        // Keep the latest contact so we can tell someone when it lands.
        existing.customerEmail = email;
        existing.customerName = String(body.customerName ?? "").trim() || existing.customerName;
        existing.phoneNumber = String(body.phoneNumber ?? "").trim() || existing.phoneNumber;
      }
      await existing.save();
      return NextResponse.json({ request: existing, deduped: true }, { status: 200 });
    }

    const created = await ProductRequest.create({
      productName,
      brand,
      category: String(body.category ?? "").trim(),
      concern: String(body.concern ?? "").trim(),
      reason: String(body.reason ?? "").trim(),
      images,
      customerMessage: String(body.customerMessage ?? "").trim().slice(0, 1000),
      customerName: String(body.customerName ?? "").trim(),
      customerEmail: email,
      phoneNumber: String(body.phoneNumber ?? "").trim(),
      source: body.source === "manual" ? "manual" : "chat",
    });

    return NextResponse.json({ request: created }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
