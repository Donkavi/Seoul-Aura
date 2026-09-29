import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import FinanceEntry from "@/models/FinanceEntry";
import { normalizeEntry } from "@/lib/finance";

/**
 * Partial updates are fine (e.g. just `{ paymentStatus }` from the status
 * toggle): the body is laid over the stored entry and the result re-validated.
 * The kind never changes — delete and re-add instead.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    const entry = await FinanceEntry.findById(params.id);
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const result = normalizeEntry(entry.kind, { ...entry.toObject(), ...body });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    // Undefined keys in the normalized entry unset fields that no longer apply.
    entry.set(result.entry);
    await entry.save();
    return NextResponse.json(entry);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    await FinanceEntry.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
