import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ type: 1 }).lean();
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { type, subtypes } = await req.json();
    if (!type) return NextResponse.json({ error: "Type is required" }, { status: 400 });

    const existing = await Category.findOne({ slug: slugify(type) });
    if (existing) {
      if (subtypes?.length) {
        const newSubs = subtypes.map((s: string) => ({ name: s, slug: slugify(s) }));
        const existingSlugs = existing.subtypes.map((s) => s.slug);
        const toAdd = newSubs.filter((s: { slug: string }) => !existingSlugs.includes(s.slug));
        existing.subtypes.push(...toAdd);
        await existing.save();
        return NextResponse.json(existing);
      }
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    const category = await Category.create({
      type,
      slug: slugify(type),
      subtypes: (subtypes ?? []).map((s: string) => ({ name: s, slug: slugify(s) })),
    });

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
