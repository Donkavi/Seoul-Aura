import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import NavMenu from "@/models/NavMenu";

export async function GET() {
  try {
    await connectDB();
    const items = await NavMenu.find().sort({ order: 1 }).lean();
    return NextResponse.json(items);
  } catch (err) {
    console.error("[nav-menu GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const count = await NavMenu.countDocuments();
    const item = await NavMenu.create({ ...body, order: body.order ?? count });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[nav-menu POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
