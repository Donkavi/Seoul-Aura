import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import DeliveryRate from "@/models/DeliveryRate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateOrderNumber, sumSavings } from "@/lib/utils";
import { revalidateCatalogue } from "@/lib/revalidate";
import { generateTrackingToken } from "@/lib/deliveryStatus";
import { isOwnCloudinaryUrl, RECEIPT_UPLOAD_FOLDER } from "@/lib/cloudinary";
import { sendOrderConfirmationToBuyer, sendOrderNotificationToAdmin } from "@/lib/email";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Admins see every order. Anyone else only ever sees their own — orders carry
 * addresses, phone numbers and payment slips.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = !!(session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;
    const sessionEmail = session?.user?.email?.toLowerCase();
    if (!isAdmin && !sessionEmail) {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);

    // ?counts=true → per-status counts for the admin queue
    if (searchParams.get("counts") === "true") {
      if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const result = await Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
      const counts: Record<string, number> = {};
      result.forEach((r: { _id: string; count: number }) => { counts[r._id] = r.count; });
      return NextResponse.json({ counts });
    }

    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const page = parseInt(searchParams.get("page") ?? "1");
    const search = searchParams.get("search")?.trim();

    const query: Record<string, unknown> = {};
    if (status && status !== "all") query.status = status;
    if (!isAdmin) {
      query.customerEmail = { $regex: `^${escapeRegex(sessionEmail!)}$`, $options: "i" };
    } else {
      const email = searchParams.get("email");
      if (email) query.customerEmail = { $regex: `^${escapeRegex(email)}$`, $options: "i" };
      if (search) {
        const rx = { $regex: escapeRegex(search), $options: "i" };
        query.$or = [
          { orderNumber: rx },
          { customerName: rx },
          { customerEmail: rx },
          { phoneNumber: rx },
          { "items.name": rx },
        ];
      }
    }

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

interface IncomingItem {
  productId?: string;
  name?: string;
  price?: number;
  quantity?: number | string;
  image?: string;
}

interface ProductForOrder {
  _id: { toString(): string };
  name: string;
  price: number;
  comparePrice?: number;
  stock: number;
  active: boolean;
  isPreOrder: boolean;
  images: string[];
  variants?: { name: string; price: number }[];
}

/** Gives back stock that was reserved for an order that never got created. */
async function releaseStock(reserved: { productId: string; quantity: number }[]) {
  if (!reserved.length) return;
  await Product.bulkWrite(
    reserved.map((r) => ({
      updateOne: { filter: { _id: r.productId }, update: { $inc: { stock: r.quantity } } },
    }))
  ).catch(console.error);
}

export async function POST(req: NextRequest) {
  try {
    // The order belongs to whoever is signed in — that is what later lets them
    // (and only them) see it and upload its payment slip.
    const session = await getServerSession(authOptions);
    const customerEmail = session?.user?.email;
    if (!customerEmail) {
      return NextResponse.json({ error: "Please sign in to place an order" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { customerName, phoneNumber, shippingAddress, paymentMethod, notes, subscriptionPlan } = body;
    const orderType = body.orderType === "subscription" ? "subscription" : "standard";

    if (!customerName?.trim() || !phoneNumber?.trim()) {
      return NextResponse.json({ error: "Please fill in your name and phone number" }, { status: 400 });
    }
    if (paymentMethod !== "cod" && paymentMethod !== "bank") {
      return NextResponse.json({ error: "Please choose Cash on Delivery or Bank Transfer" }, { status: 400 });
    }
    if (body.acceptedTerms !== true) {
      return NextResponse.json(
        { error: "Please agree to pay the delivery charge to confirm your order" },
        { status: 400 }
      );
    }
    const receiptUrl = body.deliveryFeeReceiptUrl;
    if (receiptUrl != null && receiptUrl !== "" && !isOwnCloudinaryUrl(receiptUrl, RECEIPT_UPLOAD_FOLDER)) {
      return NextResponse.json({ error: "That receipt upload didn't work. Please upload it again." }, { status: 400 });
    }
    if (!shippingAddress?.district?.trim() || !shippingAddress?.city?.trim()) {
      return NextResponse.json({ error: "Please select a delivery district and city" }, { status: 400 });
    }
    if (!shippingAddress?.line1?.trim()) {
      return NextResponse.json({ error: "Please enter your delivery address" }, { status: 400 });
    }

    // Merge lines for the same product so stock is checked against the whole quantity
    const rawItems: IncomingItem[] = Array.isArray(body.items) ? body.items : [];
    const lines = new Map<string, IncomingItem & { quantity: number }>();
    for (const it of rawItems) {
      if (!it.productId || !mongoose.isValidObjectId(it.productId)) continue;
      const qty = Math.max(1, parseInt(String(it.quantity ?? "1")) || 1);
      const existing = lines.get(it.productId);
      lines.set(it.productId, existing ? { ...existing, quantity: existing.quantity + qty } : { ...it, quantity: qty });
    }
    if (lines.size === 0 && orderType === "standard") {
      return NextResponse.json({ error: "Your bag is empty" }, { status: 400 });
    }

    const products = (await Product.find({ _id: { $in: Array.from(lines.keys()) } }).lean()) as unknown as ProductForOrder[];
    const byId = new Map(products.map((p) => [p._id.toString(), p]));

    // Prices come from the catalogue, not the browser. A variant line carries its
    // own price, so accept the cart's price only when it is one this product sells at.
    const items = [];
    for (const [productId, line] of Array.from(lines)) {
      const product = byId.get(productId);
      if (!product || !product.active || product.isPreOrder) {
        return NextResponse.json(
          { error: `${line.name ?? "An item in your bag"} is no longer available. Please remove it and try again.` },
          { status: 409 }
        );
      }
      const allowedPrices = [product.price, ...(product.variants ?? []).map((v) => v.price)];
      const price = allowedPrices.includes(Number(line.price)) ? Number(line.price) : product.price;
      items.push({
        productId,
        name: line.name?.trim() || product.name,
        price,
        quantity: line.quantity,
        image: product.images?.[0] ?? line.image,
      });
    }

    // Delivery charge is set by the courier's rate for the chosen city
    const rate = await DeliveryRate.findOne({
      district: shippingAddress.district.trim(),
      city: shippingAddress.city.trim(),
    }).lean();
    if (!rate) {
      return NextResponse.json({ error: "We couldn't find a delivery rate for that city. Please reselect it." }, { status: 400 });
    }
    const shippingFee = rate.charge;

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const savings = sumSavings(items.map((i) => ({ ...i, comparePrice: byId.get(i.productId)?.comparePrice })));
    const total = subtotal + shippingFee;

    // Reserve stock one product at a time. The stock condition makes each
    // decrement atomic, so two shoppers can't both buy the last unit.
    const reserved: { productId: string; quantity: number }[] = [];
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      ).lean();
      if (!updated) {
        await releaseStock(reserved);
        const left = byId.get(item.productId)?.stock ?? 0;
        return NextResponse.json(
          {
            error: left > 0
              ? `Only ${left} left of ${item.name}. Please reduce the quantity and try again.`
              : `${item.name} just sold out. Please remove it and try again.`,
          },
          { status: 409 }
        );
      }
      reserved.push({ productId: item.productId, quantity: item.quantity });
    }

    let order;
    try {
      order = await Order.create({
        orderNumber: generateOrderNumber(),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        items,
        subtotal,
        shippingFee,
        discount: 0,
        savings,
        total,
        orderType,
        subscriptionPlan: orderType === "subscription" ? subscriptionPlan : undefined,
        shippingAddress: {
          line1: shippingAddress.line1.trim(),
          line2: shippingAddress.line2?.trim() || undefined,
          district: shippingAddress.district.trim(),
          city: shippingAddress.city.trim(),
          postalCode: shippingAddress.postalCode?.trim() || undefined,
          country: shippingAddress.country?.trim() || "Sri Lanka",
        },
        paymentMethod,
        notes: notes?.trim() || undefined,
        termsAcceptedAt: new Date(),
        deliveryFeeReceipt: receiptUrl ? { url: receiptUrl, uploadedAt: new Date() } : undefined,
        // Minted up front so the tracking link is ready the moment we ship.
        trackingToken: generateTrackingToken(),
      });
    } catch (err) {
      await releaseStock(reserved);
      throw err;
    }

    // Stock changed, so the cached shop pages are now showing old counts
    revalidateCatalogue();

    // Fire emails in background — don't block the response
    const emailData = {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      phoneNumber: order.phoneNumber,
      items: order.items.map((i: { name: string; quantity: number; price: number; image?: string }) => ({
        name: i.name, quantity: i.quantity, price: i.price, image: i.image,
      })),
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      discount: order.discount,
      savings: order.savings ?? 0,
      total: order.total,
      orderType: order.orderType,
      paymentMethod: order.paymentMethod,
      shippingAddress: order.shippingAddress,
      notes: order.notes,
      deliveryFeeReceiptUrl: order.deliveryFeeReceipt?.url,
      trackingToken: order.trackingToken,
    };
    Promise.all([
      sendOrderConfirmationToBuyer(emailData),
      sendOrderNotificationToAdmin(emailData),
    ]).catch(console.error);

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
