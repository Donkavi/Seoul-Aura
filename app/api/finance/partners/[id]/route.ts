import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Partner from "@/models/Partner";
import FinanceEntry from "@/models/FinanceEntry";
import { BUSINESS_FUND } from "@/lib/finance";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    const partner = await Partner.findById(params.id);
    if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { name, sharePercent, active, notes } = await req.json();
    const previousName = partner.name;
    const nextName = typeof name === "string" && name.trim() ? name.trim() : previousName;
    if (nextName.toLowerCase() === BUSINESS_FUND.toLowerCase()) {
      return NextResponse.json({ error: `"${BUSINESS_FUND}" is reserved for pooled spending` }, { status: 400 });
    }

    partner.name = nextName;
    if (sharePercent !== undefined) partner.sharePercent = Number(sharePercent);
    if (active !== undefined) partner.active = !!active;
    if (notes !== undefined) partner.notes = notes;
    await partner.save();

    // Entries point at partners by name, so carry the history over to the new one.
    if (nextName !== previousName) {
      await FinanceEntry.updateMany({ paidBy: previousName }, { $set: { paidBy: nextName } });
    }
    return NextResponse.json(partner);
  } catch (err: any) {
    if (err.code === 11000) return NextResponse.json({ error: "A partner with that name already exists" }, { status: 409 });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    const partner = await Partner.findById(params.id);
    if (!partner) return NextResponse.json({ success: true });

    // Deleting would orphan their investments and payments; deactivating keeps the history intact.
    const used = await FinanceEntry.countDocuments({ paidBy: partner.name });
    if (used > 0) {
      return NextResponse.json(
        { error: `${partner.name} has ${used} ledger entr${used === 1 ? "y" : "ies"}. Mark them inactive instead.` },
        { status: 409 }
      );
    }
    await partner.deleteOne();
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
