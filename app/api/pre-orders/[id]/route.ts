import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PreOrder from "@/models/PreOrder";
import Settings from "@/models/Settings";
import { sendPreOrderStatusUpdateToBuyer, sendPreOrderRevisionToBuyer } from "@/lib/email";

interface IncomingPatchItem {
  productBrand?: string;
  productName?: string;
  productLink?: string;
  productImage?: string;
  quantity?: number;
  unitPrice?: number;
  availability?: "available" | "unavailable";
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const preOrder = await PreOrder.findById(params.id).lean();
    if (!preOrder) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(preOrder);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await req.json();

    const allowed: Record<string, unknown> = {};
    const fields = ["status", "adminNotes", "estimatedPrice", "estimatedAvailability", "depositPaid", "balancePaymentMethod"];
    for (const f of fields) {
      if (body[f] !== undefined) allowed[f] = body[f];
    }

    const previous = await PreOrder.findById(params.id).lean() as
      | { status: string; depositPaid?: boolean; items?: { availability?: string }[] }
      | null;
    if (!previous) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Merge per-item availability updates onto existing items (preserve other fields)
    let availabilityChanged = false;
    if (Array.isArray(body.items)) {
      const incoming = body.items as IncomingPatchItem[];
      const merged = (previous.items ?? []).map((existing, i) => {
        const inc = incoming[i];
        const newAvail = inc?.availability;
        if (newAvail && newAvail !== existing.availability) availabilityChanged = true;
        return {
          ...existing,
          ...(newAvail ? { availability: newAvail } : {}),
        };
      });
      allowed.items = merged;
    }

    const depositChanged =
      body.depositPaid !== undefined && !!body.depositPaid !== !!previous.depositPaid;

    const updated = await PreOrder.findByIdAndUpdate(params.id, allowed, { new: true });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Settings for totals in emails (delivery charge / currency)
    const statusChanged = body.status && body.status !== previous.status;
    let deliveryCharge = 350;
    let currencySymbol = "Rs.";
    if (statusChanged || availabilityChanged || depositChanged) {
      const settingsDoc = await Settings.findOne().lean().catch(() => null);
      deliveryCharge = (settingsDoc as { shippingFee?: number } | null)?.shippingFee ?? 350;
      currencySymbol = (settingsDoc as { currencySymbol?: string } | null)?.currencySymbol ?? "Rs.";
    }

    const mappedItems = updated.items.map((it: { productBrand: string; productName: string; productLink?: string; productImage?: string; quantity: number; unitPrice?: number; availability?: "available" | "unavailable" }) => ({
      productBrand: it.productBrand,
      productName: it.productName,
      productLink: it.productLink,
      productImage: it.productImage,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      availability: it.availability,
    }));

    // Email buyer when status changes — now with full items + totals
    if (statusChanged) {
      sendPreOrderStatusUpdateToBuyer({
        requestNumber: updated.requestNumber,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        productName: updated.productName,
        status: updated.status,
        estimatedPrice: updated.estimatedPrice,
        estimatedAvailability: updated.estimatedAvailability,
        adminNotes: updated.adminNotes,
        items: mappedItems,
        deliveryCharge,
        currencySymbol,
        balancePaymentMethod: updated.balancePaymentMethod,
        depositPaid: updated.depositPaid,
      }).catch(console.error);
    }

    // Email buyer a revised invoice when availability or deposit-paid changes
    if (availabilityChanged || depositChanged) {
      const reason: "availability" | "deposit" | "both" =
        availabilityChanged && depositChanged ? "both" : availabilityChanged ? "availability" : "deposit";

      sendPreOrderRevisionToBuyer({
        requestNumber: updated.requestNumber,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        phoneNumber: updated.phoneNumber,
        items: mappedItems,
        deliveryCharge,
        currencySymbol,
        balancePaymentMethod: updated.balancePaymentMethod,
        depositPaid: updated.depositPaid,
        reason,
      }).catch(console.error);
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    await PreOrder.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
