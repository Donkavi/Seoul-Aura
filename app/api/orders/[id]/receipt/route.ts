import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { isOwnCloudinaryUrl, RECEIPT_UPLOAD_FOLDER } from "@/lib/cloudinary";
import { sendOrderReceiptUploadedToAdmin } from "@/lib/email";

/**
 * The buyer attaches (or replaces) the bank slip for their delivery charge.
 * The image itself is already on Cloudinary; this records the link on the order.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase();
    if (!email) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { url } = await req.json().catch(() => ({ url: null }));
    if (!isOwnCloudinaryUrl(url, RECEIPT_UPLOAD_FOLDER)) {
      return NextResponse.json({ error: "That upload didn't work. Please try again." }, { status: 400 });
    }

    await connectDB();
    const order = await Order.findById(params.id).lean<{
      _id: mongoose.Types.ObjectId;
      orderNumber: string;
      customerName: string;
      customerEmail: string;
      shippingFee: number;
      status: string;
      deliveryFeePaid?: boolean;
    }>();
    if (!order || order.customerEmail.toLowerCase() !== email) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.deliveryFeePaid) {
      return NextResponse.json({ error: "We've already confirmed your delivery charge payment." }, { status: 409 });
    }
    if (order.status === "rejected") {
      return NextResponse.json({ error: "This order has been cancelled." }, { status: 409 });
    }

    // A targeted update, so an older order with since-retired values still saves
    const updated = await Order.findByIdAndUpdate(
      order._id,
      { $set: { deliveryFeeReceipt: { url, uploadedAt: new Date() } } },
      { new: true }
    ).lean();

    sendOrderReceiptUploadedToAdmin({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      shippingFee: order.shippingFee,
      receiptUrl: url,
    }).catch(console.error);

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
