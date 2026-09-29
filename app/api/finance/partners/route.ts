import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Partner from "@/models/Partner";
import { BUSINESS_FUND } from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    const partners = await Partner.find().sort({ createdAt: 1 }).lean();
    return NextResponse.json(partners);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    const { name, sharePercent, active, notes } = await req.json();
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed) return NextResponse.json({ error: "Name required" }, { status: 400 });
    if (trimmed.toLowerCase() === BUSINESS_FUND.toLowerCase()) {
      return NextResponse.json({ error: `"${BUSINESS_FUND}" is reserved for pooled spending` }, { status: 400 });
    }
    const partner = await Partner.create({ name: trimmed, sharePercent, active, notes });
    return NextResponse.json(partner, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) return NextResponse.json({ error: "A partner with that name already exists" }, { status: 409 });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
