import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Concern from "@/models/Concern";
import { slugify } from "@/lib/utils";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await req.json();
    if (body.name) body.slug = slugify(body.name.trim());
    const concern = await Concern.findByIdAndUpdate(params.id, body, { new: true });
    if (!concern) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(concern);
  } catch (err: any) {
    if (err.code === 11000) return NextResponse.json({ error: "Name already exists" }, { status: 409 });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    await Concern.findByIdAndDelete(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
