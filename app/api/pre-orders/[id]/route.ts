import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PreOrder from "@/models/PreOrder";
import Settings from "@/models/Settings";
import {
  sendPreOrderStatusUpdateToBuyer,
  sendPreOrderRevisionToBuyer,
  sendPreOrderItemsAddedToBuyer,
} from "@/lib/email";

interface IncomingPatchItem {
  productBrand?: string;
  productName?: string;
  productLink?: string;
  productImage?: string;
  quantity?: number;
  unitPrice?: number;
  /** Required whenever unitPrice differs from the price already on record. */
  priceChangeReason?: string;
  availability?: "available" | "unavailable";
}

interface IncomingNewItem {
  productBrand?: string;
  productName?: string;
  productLink?: string;
  productImage?: string;
  quantity?: number;
  unitPrice?: number;
}

interface StoredPriceChange {
  previousUnitPrice?: number;
  newUnitPrice: number;
  reason: string;
  changedAt: Date;
}

interface StoredItem {
  productBrand: string;
  productName: string;
  productLink?: string;
  productImage?: string;
  quantity: number;
  unitPrice?: number;
  originalUnitPrice?: number;
  priceHistory?: StoredPriceChange[];
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
      | { status: string; depositPaid?: boolean; items?: StoredItem[] }
      | null;
    if (!previous) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Merge per-item availability + unit-price updates onto existing items
    // (all other stored fields are preserved as-is).
    let availabilityChanged = false;
    const priceChanges: {
      productBrand: string;
      productName: string;
      quantity: number;
      previousUnitPrice?: number;
      newUnitPrice: number;
      reason: string;
    }[] = [];
    /** Indices of items repriced in *this* request — drives the old→new display. */
    const repricedNow = new Set<number>();

    if (Array.isArray(body.items)) {
      const incoming = body.items as IncomingPatchItem[];
      const changedAt = new Date();
      const merged: StoredItem[] = [];

      for (let i = 0; i < (previous.items ?? []).length; i++) {
        const existing = (previous.items ?? [])[i];
        const inc = incoming[i];
        const next: StoredItem = { ...existing };

        const newAvail = inc?.availability;
        if (newAvail && newAvail !== existing.availability) availabilityChanged = true;
        if (newAvail) next.availability = newAvail;

        // Unit price revision — only when a finite, non-negative number is sent
        // and it actually differs from what's on record.
        if (inc?.unitPrice !== undefined && inc.unitPrice !== null) {
          const newPrice = Number(inc.unitPrice);
          if (!Number.isFinite(newPrice) || newPrice < 0) {
            return NextResponse.json(
              { error: `Invalid unit price for "${existing.productName}"` },
              { status: 400 }
            );
          }

          if (newPrice !== existing.unitPrice) {
            const reason = inc.priceChangeReason?.trim();
            // A reason is mandatory when revising an existing quote; a first-time
            // quote (previously "to be quoted") falls back to a default label.
            if (existing.unitPrice != null && !reason) {
              return NextResponse.json(
                { error: `A reason is required to change the price of "${existing.productName}"` },
                { status: 400 }
              );
            }
            const finalReason = reason || "Initial quote";

            next.unitPrice = newPrice;
            next.originalUnitPrice = existing.originalUnitPrice ?? existing.unitPrice ?? newPrice;
            next.priceHistory = [
              ...(existing.priceHistory ?? []),
              {
                previousUnitPrice: existing.unitPrice,
                newUnitPrice: newPrice,
                reason: finalReason,
                changedAt,
              },
            ];

            repricedNow.add(i);
            priceChanges.push({
              productBrand: existing.productBrand,
              productName: existing.productName,
              quantity: existing.quantity,
              previousUnitPrice: existing.unitPrice,
              newUnitPrice: newPrice,
              reason: finalReason,
            });
          }
        }

        merged.push(next);
      }

      allowed.items = merged;
    }

    // Append newly-added products (admin picks products to add to an existing request)
    const newlyAdded: StoredItem[] = [];
    const newItemsMessage = typeof body.newItemsMessage === "string" ? body.newItemsMessage.trim() : "";
    if (Array.isArray(body.newItems) && body.newItems.length > 0) {
      if (!newItemsMessage) {
        return NextResponse.json(
          { error: "A message is required when adding new products — it's shown to the customer in the email." },
          { status: 400 }
        );
      }
      for (const raw of body.newItems as IncomingNewItem[]) {
        const productBrand = (raw.productBrand ?? "").trim();
        const productName = (raw.productName ?? "").trim();
        const quantity = Number(raw.quantity ?? 1);
        if (!productBrand || !productName || !Number.isFinite(quantity) || quantity < 1) {
          return NextResponse.json(
            { error: "Each new product needs a brand, name and valid quantity." },
            { status: 400 }
          );
        }
        let unitPrice: number | undefined;
        if (raw.unitPrice !== undefined && raw.unitPrice !== null) {
          unitPrice = Number(raw.unitPrice);
          if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            return NextResponse.json(
              { error: `Invalid unit price for "${productName}"` },
              { status: 400 }
            );
          }
        }
        newlyAdded.push({
          productBrand,
          productName,
          productLink: raw.productLink?.trim() || undefined,
          productImage: raw.productImage,
          quantity,
          unitPrice,
          originalUnitPrice: unitPrice,
          availability: "available",
        });
      }
      allowed.items = [...((allowed.items as StoredItem[] | undefined) ?? previous.items ?? []), ...newlyAdded];
    }

    const depositChanged =
      body.depositPaid !== undefined && !!body.depositPaid !== !!previous.depositPaid;

    const updated = await PreOrder.findByIdAndUpdate(params.id, allowed, { new: true });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Settings for totals in emails (delivery charge / currency)
    const statusChanged = body.status && body.status !== previous.status;
    const priceChanged = priceChanges.length > 0;
    const itemsAdded = newlyAdded.length > 0;
    let deliveryCharge = 350;
    let currencySymbol = "Rs.";
    if (statusChanged || availabilityChanged || depositChanged || priceChanged || itemsAdded) {
      const settingsDoc = await Settings.findOne().lean().catch(() => null);
      deliveryCharge = (settingsDoc as { shippingFee?: number } | null)?.shippingFee ?? 350;
      currencySymbol = (settingsDoc as { currencySymbol?: string } | null)?.currencySymbol ?? "Rs.";
    }

    const mappedItems = updated.items.map((it: StoredItem, i: number) => ({
      productBrand: it.productBrand,
      productName: it.productName,
      productLink: it.productLink,
      productImage: it.productImage,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      // Only items repriced in this save show an old → new comparison
      previousUnitPrice: repricedNow.has(i)
        ? it.priceHistory?.[it.priceHistory.length - 1]?.previousUnitPrice
        : undefined,
      priceChangeReason: repricedNow.has(i)
        ? it.priceHistory?.[it.priceHistory.length - 1]?.reason
        : undefined,
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

    // Email buyer a revised invoice when availability, pricing or deposit changes
    if (availabilityChanged || depositChanged || priceChanged) {
      const reasons: ("availability" | "deposit" | "price")[] = [];
      if (priceChanged) reasons.push("price");
      if (availabilityChanged) reasons.push("availability");
      if (depositChanged) reasons.push("deposit");

      sendPreOrderRevisionToBuyer({
        requestNumber: updated.requestNumber,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        phoneNumber: updated.phoneNumber,
        items: mappedItems,
        priceChanges,
        deliveryCharge,
        currencySymbol,
        balancePaymentMethod: updated.balancePaymentMethod,
        depositPaid: updated.depositPaid,
        reasons,
      }).catch(console.error);
    }

    // Email buyer when the admin adds new products to their request
    if (itemsAdded) {
      sendPreOrderItemsAddedToBuyer({
        requestNumber: updated.requestNumber,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        phoneNumber: updated.phoneNumber,
        addedItems: mappedItems.slice(mappedItems.length - newlyAdded.length),
        message: newItemsMessage,
        items: mappedItems,
        deliveryCharge,
        currencySymbol,
        balancePaymentMethod: updated.balancePaymentMethod,
        depositPaid: updated.depositPaid,
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
