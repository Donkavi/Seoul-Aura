import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ProductRequest from "@/models/ProductRequest";

const STATUSES = ["pending", "sourcing", "added", "declined"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (typeof body.status === "string" && STATUSES.includes(body.status)) {
      update.status = body.status;
    }
    if (typeof body.adminNotes === "string") update.adminNotes = body.adminNotes.trim();

    const doc = await ProductRequest.findByIdAndUpdate(params.id, update, { new: true });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    await ProductRequest.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
