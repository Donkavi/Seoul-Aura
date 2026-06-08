import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Settings from "@/models/Settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    let settings = await Settings.findOne().lean();
    if (!settings) {
      settings = await Settings.create({});
    }
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    // Strip MongoDB immutable / meta fields
    const { _id, __v, createdAt, updatedAt, ...updateData } = body;
    void _id; void __v; void createdAt; void updatedAt;

    let doc = await Settings.findOne();
    if (!doc) {
      doc = new Settings(updateData);
    } else {
      doc.set(updateData);
    }
    await doc.save();
    return NextResponse.json(doc.toObject());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
