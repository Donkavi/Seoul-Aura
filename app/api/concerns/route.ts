import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Concern from "@/models/Concern";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const concerns = await Concern.find().sort({ order: 1, name: 1 }).lean();
    return NextResponse.json(concerns);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, description, image } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const count = await Concern.countDocuments();
    const concern = await Concern.create({
      name: name.trim(),
      slug: slugify(name.trim()),
      description: description?.trim() ?? "",
      image: image?.trim() ?? "",
      order: count,
    });
    return NextResponse.json(concern, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) return NextResponse.json({ error: "Concern already exists" }, { status: 409 });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
