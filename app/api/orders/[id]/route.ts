import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import FinanceEntry from "@/models/FinanceEntry";
import { revalidateCatalogue } from "@/lib/revalidate";
import { isDeliveryStatus, generateTrackingToken, type DeliveryStatus } from "@/lib/deliveryStatus";
import { isOrderStatus, holdsStock } from "@/lib/orderStatus";
import {
  sendOrderStatusUpdateToBuyer,
  sendOrderDeliveryFeePaidToBuyer,
  sendPreOrderDeliveryEstimateToBuyer,
} from "@/lib/email";

interface StoredDeliveryEvent {
  status: DeliveryStatus;
  note?: string;
  at: Date;
}

interface StoredOrder {
  status: string;
  customerEmail: string;
  items: { productId: mongoose.Types.ObjectId; quantity: number }[];
  deliveryFeePaid?: boolean;
  deliveryStatus?: DeliveryStatus;
  deliveryEvents?: StoredDeliveryEvent[];
  trackingToken?: string;
  estimatedDeliveryDate?: Date | string;
  estimatedDeliveryMessage?: string;
}

/** Admin, or the customer the order belongs to. */
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const session = await getServerSession(authOptions);
    const isAdmin = !!(session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;
    if (!session?.user?.email) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

    await connectDB();
    const order = await Order.findById(params.id).lean<StoredOrder>();
    if (!order || (!isAdmin && order.customerEmail.toLowerCase() !== session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * Admin updates — the same controls as a pre-order: status, delivery-charge
 * payment, delivery leg, estimated arrival and internal notes.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await connectDB();
    const body = await req.json();

    if (body.status !== undefined && !isOrderStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const previous = await Order.findById(params.id).lean<StoredOrder>();
    if (!previous) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const allowed: Record<string, unknown> = {};
    for (const f of ["status", "adminNotes", "deliveryFeePaid", "estimatedDeliveryDate", "estimatedDeliveryMessage"]) {
      if (body[f] !== undefined) allowed[f] = body[f];
    }
    if (body.deliveryFeePaid !== undefined) allowed.deliveryFeePaid = !!body.deliveryFeePaid;

    // ── Delivery leg ────────────────────────────────────────────────────────
    // Recorded on the journey (and the public /track page) straight away.
    // `null` rewinds the parcel to "not shipped yet"; re-picking the current
    // leg is a no-op.
    const unset: Record<string, ""> = {};
    if (body.deliveryStatus !== undefined) {
      const next = body.deliveryStatus;
      if (next === null || next === "") {
        if (previous.deliveryStatus) {
          unset.deliveryStatus = "";
          allowed.deliveryEvents = [];
        }
      } else if (!isDeliveryStatus(next)) {
        return NextResponse.json({ error: "Unknown delivery status" }, { status: 400 });
      } else if (next !== previous.deliveryStatus) {
        const note = typeof body.deliveryNote === "string" ? body.deliveryNote.trim() : "";
        allowed.deliveryStatus = next;
        allowed.deliveryEvents = [
          ...(previous.deliveryEvents ?? []),
          { status: next, note: note || undefined, at: new Date() },
        ];
        allowed.trackingToken = previous.trackingToken || generateTrackingToken();
      }
    }
    // Older orders were placed before tracking tokens existed
    if (!previous.trackingToken && !allowed.trackingToken) allowed.trackingToken = generateTrackingToken();

    // Compared by calendar date only — the admin picks a date, not a time.
    const toDateKey = (v: unknown): string | null => {
      if (!v) return null;
      const d = new Date(v as string | Date);
      return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    };
    const estimatedDeliveryChanged =
      (body.estimatedDeliveryDate !== undefined &&
        toDateKey(body.estimatedDeliveryDate) !== toDateKey(previous.estimatedDeliveryDate)) ||
      (body.estimatedDeliveryMessage !== undefined &&
        (body.estimatedDeliveryMessage ?? "").trim() !== (previous.estimatedDeliveryMessage ?? ""));

    const updated = await Order.findByIdAndUpdate(
      params.id,
      { $set: allowed, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
      { new: true }
    );
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const statusChanged = body.status !== undefined && body.status !== previous.status;
    const feeJustPaid = !!body.deliveryFeePaid && !previous.deliveryFeePaid;

    // Stock is taken when the order is placed. Rejecting hands it back, and
    // reopening a rejected order takes it again.
    if (statusChanged && holdsStock(previous.status) !== holdsStock(updated.status) && updated.items.length) {
      const sign = holdsStock(updated.status) ? -1 : 1;
      await Product.bulkWrite(
        updated.items.map((item) => ({
          updateOne: { filter: { _id: item.productId }, update: { $inc: { stock: sign * item.quantity } } },
        }))
      );
      revalidateCatalogue();
    }

    // "done" means everything is paid, so finance sales for it stop showing as pending.
    if (statusChanged && updated.status === "done") {
      await FinanceEntry.updateMany(
        { kind: "sale", reference: updated.orderNumber, paymentStatus: "pending" },
        { $set: { paymentStatus: "paid" } }
      ).catch(console.error);
    }

    if (statusChanged) {
      sendOrderStatusUpdateToBuyer({
        orderNumber: updated.orderNumber,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        phoneNumber: updated.phoneNumber,
        status: updated.status,
        items: updated.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price, image: i.image })),
        subtotal: updated.subtotal,
        shippingFee: updated.shippingFee,
        savings: updated.savings,
        total: updated.total,
        paymentMethod: updated.paymentMethod,
        shippingAddress: updated.shippingAddress,
        deliveryFeePaid: updated.deliveryFeePaid,
        deliveryFeeReceiptUrl: updated.deliveryFeeReceipt?.url,
        estimatedDeliveryDate: updated.estimatedDeliveryDate,
        estimatedDeliveryMessage: updated.estimatedDeliveryMessage,
        trackingToken: updated.trackingToken,
      }).catch(console.error);
    }

    // A status email in the same save already shows the charge as paid
    if (feeJustPaid && !statusChanged) {
      sendOrderDeliveryFeePaidToBuyer({
        orderNumber: updated.orderNumber,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        shippingFee: updated.shippingFee,
        total: updated.total,
        paymentMethod: updated.paymentMethod,
        trackingToken: updated.trackingToken,
      }).catch(console.error);
    }

    if (estimatedDeliveryChanged && updated.estimatedDeliveryDate) {
      sendPreOrderDeliveryEstimateToBuyer({
        kind: "order",
        requestNumber: updated.orderNumber,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        estimatedDeliveryDate: updated.estimatedDeliveryDate,
        message: updated.estimatedDeliveryMessage,
        trackingToken: updated.trackingToken,
      }).catch(console.error);
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await connectDB();
    const order = await Order.findByIdAndDelete(params.id).lean<StoredOrder>();
    // A deleted order that was still holding stock gives it back
    if (order && holdsStock(order.status) && order.items.length) {
      await Product.bulkWrite(
        order.items.map((item) => ({
          updateOne: { filter: { _id: item.productId }, update: { $inc: { stock: item.quantity } } },
        }))
      );
      revalidateCatalogue();
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
