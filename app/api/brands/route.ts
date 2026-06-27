import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Brand from "@/models/Brand";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const brands = await Brand.find().sort({ name: 1 }).lean();
    return NextResponse.json(brands);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const slug = slugify(body.name);
    const brand = await Brand.create({ ...body, slug });
    return NextResponse.json(brand, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
