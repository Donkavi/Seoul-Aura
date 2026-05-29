import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PreOrder from "@/models/PreOrder";
import { sendPreOrderStatusUpdateToBuyer } from "@/lib/email";

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
    const fields = ["status", "adminNotes", "estimatedPrice", "estimatedAvailability"];
    for (const f of fields) {
      if (body[f] !== undefined) allowed[f] = body[f];
    }

    const previous = await PreOrder.findById(params.id).lean() as { status: string } | null;
    const updated = await PreOrder.findByIdAndUpdate(params.id, allowed, { new: true });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Email buyer only when status actually changes
    if (body.status && previous && body.status !== previous.status) {
      sendPreOrderStatusUpdateToBuyer({
        requestNumber: updated.requestNumber,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        productName: updated.productName,
        status: updated.status,
        estimatedPrice: updated.estimatedPrice,
        estimatedAvailability: updated.estimatedAvailability,
        adminNotes: updated.adminNotes,
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
