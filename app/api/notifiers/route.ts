import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notifier from "@/models/Notifier";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public — subscribe to the newsletter
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, source } = await req.json();
    const clean = String(email ?? "").trim().toLowerCase();

    if (!EMAIL_RX.test(clean)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const existing = await Notifier.findOne({ email: clean });
    if (existing) {
      if (!existing.active) {
        existing.active = true;
        await existing.save();
      }
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    await Notifier.create({ email: clean, source: source || "newsletter" });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Admin — list subscribers
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "500");

    const query: Record<string, unknown> = {};
    if (search) query.email = { $regex: search, $options: "i" };

    const [notifiers, total] = await Promise.all([
      Notifier.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      Notifier.countDocuments(query),
    ]);

    return NextResponse.json({ notifiers, total });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
