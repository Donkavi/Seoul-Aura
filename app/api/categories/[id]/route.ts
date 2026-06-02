import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import { slugify } from "@/lib/utils";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await req.json();
    const category = await Category.findByIdAndUpdate(params.id, body, { new: true });
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { subtypeName, removeSlug } = await req.json();
    const category = await Category.findById(params.id);
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (removeSlug) {
      category.subtypes = category.subtypes.filter((s: { slug: string }) => s.slug !== removeSlug);
    } else if (subtypeName) {
      category.subtypes.push({ name: subtypeName, slug: slugify(subtypeName) });
    }

    await category.save();
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    await Category.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
