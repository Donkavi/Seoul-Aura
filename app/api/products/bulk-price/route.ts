import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

interface PriceUpdate {
  id: string;
  price?: number;
  priceKRW?: number;
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as { isAdmin?: boolean } | undefined)?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { updates } = await req.json();
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No updates provided." }, { status: 400 });
    }

    const ops = (updates as PriceUpdate[])
      .filter((u) => u.id)
      .map((u) => {
        const set: Record<string, number> = {};
        if (u.price != null && !Number.isNaN(u.price) && u.price >= 0) set.price = Math.round(u.price);
        if (u.priceKRW != null && !Number.isNaN(u.priceKRW) && u.priceKRW >= 0) set.priceKRW = Math.round(u.priceKRW);
        return { id: u.id, set };
      })
      .filter((u) => Object.keys(u.set).length > 0);

    await Promise.all(ops.map((u) => Product.findByIdAndUpdate(u.id, { $set: u.set })));

    return NextResponse.json({ success: true, updated: ops.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
