import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PreOrder from "@/models/PreOrder";
import Settings from "@/models/Settings";
import { sendPreOrderConfirmationToBuyer, sendPreOrderNotificationToAdmin } from "@/lib/email";

function generateRequestNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRE-${timestamp}-${random}`;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    // ?counts=true → return per-status counts only (no pagination)
    if (searchParams.get("counts") === "true") {
      const result = await PreOrder.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      const counts: Record<string, number> = {};
      result.forEach((r: { _id: string; count: number }) => { counts[r._id] = r.count; });
      return NextResponse.json({ counts });
    }

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

interface IncomingItem {
  productBrand?: string;
  productName?: string;
  productLink?: string;
  productImage?: string;
  quantity?: string | number;
  unitPrice?: number;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { customerName, customerEmail, phoneNumber, origin, notes, balancePaymentMethod } = body;

    // Accept either a multi-item `items` array or legacy single-product fields
    const rawItems: IncomingItem[] = Array.isArray(body.items) && body.items.length
      ? body.items
      : [{
          productBrand: body.productBrand,
          productName: body.productName,
          productLink: body.productLink,
          quantity: body.quantity,
        }];

    const items = rawItems
      .filter((it) => it.productBrand?.toString().trim() && it.productName?.toString().trim())
      .map((it) => ({
        productBrand: it.productBrand!.toString().trim(),
        productName: it.productName!.toString().trim(),
        productLink: it.productLink?.toString().trim(),
        productImage: it.productImage?.toString().trim(),
        quantity: Math.max(1, parseInt(String(it.quantity ?? "1")) || 1),
        unitPrice: it.unitPrice != null ? Number(it.unitPrice) : undefined,
      }));

    if (!customerName?.trim() || !customerEmail?.trim() || !phoneNumber?.trim() || items.length === 0) {
      return NextResponse.json(
        { error: "Customer details and at least one product are required" },
        { status: 400 }
      );
    }

    const first = items[0];
    const preOrder = await PreOrder.create({
      requestNumber: generateRequestNumber(),
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      items,
      // Mirror first item into legacy fields for list views
      productBrand: first.productBrand,
      productName: first.productName,
      productLink: first.productLink,
      quantity: first.quantity,
      origin: origin ?? "Other",
      notes: notes?.trim(),
      balancePaymentMethod: balancePaymentMethod === "bank" || balancePaymentMethod === "cod" ? balancePaymentMethod : undefined,
      status: "pending",
    });

    // Fetch settings for delivery charge / currency in background
    const settingsDoc = await Settings.findOne().lean().catch(() => null);
    const deliveryCharge = (settingsDoc as { shippingFee?: number } | null)?.shippingFee ?? 350;
    const currencySymbol = (settingsDoc as { currencySymbol?: string } | null)?.currencySymbol ?? "Rs.";

    // Fire emails in background — don't block the response
    const emailData = {
      requestNumber: preOrder.requestNumber,
      customerName: preOrder.customerName,
      customerEmail: preOrder.customerEmail,
      phoneNumber: preOrder.phoneNumber,
      items: preOrder.items.map((it: { productBrand: string; productName: string; productLink?: string; productImage?: string; quantity: number; unitPrice?: number }) => ({
        productBrand: it.productBrand,
        productName: it.productName,
        productLink: it.productLink,
        productImage: it.productImage,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
      origin: preOrder.origin ?? "Other",
      notes: preOrder.notes,
      deliveryCharge,
      currencySymbol,
      balancePaymentMethod: preOrder.balancePaymentMethod,
    };
    Promise.all([
      sendPreOrderConfirmationToBuyer(emailData),
      sendPreOrderNotificationToAdmin(emailData),
    ]).catch(console.error);

    return NextResponse.json(preOrder, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
