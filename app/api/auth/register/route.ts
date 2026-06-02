import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, email, password, phone } = await req.json();

    if (!name?.trim() || !email?.trim() || !password || !phone?.trim()) {
      return NextResponse.json({ error: "Name, email, password and phone are required" }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const lower = email.toLowerCase().trim();
    const existing = await User.findOne({ email: lower });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in instead." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      name: name.trim(),
      email: lower,
      passwordHash,
      phone: phone.trim(),
      phoneVerified: false,
      subscriptionStatus: "none",
      addresses: [],
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
