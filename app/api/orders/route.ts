import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { generateOrderNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const page = parseInt(searchParams.get("page") ?? "1");

    const email = searchParams.get("email");
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (email) query.customerEmail = { $regex: `^${email}$`, $options: "i" };

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const order = await Order.create({
      ...body,
      orderNumber: generateOrderNumber(),
    });

    // Decrement stock for each ordered product
    if (Array.isArray(body.items) && body.items.length > 0) {
      await Product.bulkWrite(
        body.items.map((item: { productId: string; quantity: number }) => ({
          updateOne: {
            filter: { _id: item.productId },
            update: { $inc: { stock: -item.quantity } },
          },
        }))
      );
    }

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
