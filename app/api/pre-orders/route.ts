import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PreOrder from "@/models/PreOrder";

function generateRequestNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRE-${timestamp}-${random}`;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const page = parseInt(searchParams.get("page") ?? "1");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: "i" } },
        { productBrand: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
        { requestNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [preOrders, total] = await Promise.all([
      PreOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PreOrder.countDocuments(query),
    ]);

    return NextResponse.json({
      preOrders,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      customerName,
      customerEmail,
      phoneNumber,
      productBrand,
      productName,
      productLink,
      quantity,
      origin,
      notes,
    } = body;

    if (
      !customerName?.trim() ||
      !customerEmail?.trim() ||
      !phoneNumber?.trim() ||
      !productBrand?.trim() ||
      !productName?.trim()
    ) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    const preOrder = await PreOrder.create({
      requestNumber: generateRequestNumber(),
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      productBrand: productBrand.trim(),
      productName: productName.trim(),
      productLink: productLink?.trim(),
      quantity: Math.max(1, parseInt(quantity ?? "1")),
      origin: origin ?? "Other",
      notes: notes?.trim(),
      status: "pending",
    });

    return NextResponse.json(preOrder, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
