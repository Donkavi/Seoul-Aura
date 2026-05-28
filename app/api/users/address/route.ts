import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, address } = await req.json();
    if (!email || !address?.line1 || !address?.city) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If this address is default, unset others first
    const update: Record<string, unknown> = { $push: { addresses: address } };
    if (address.isDefault) {
      await User.updateOne(
        { email },
        { $set: { "addresses.$[].isDefault": false } }
      );
    }

    const user = await User.findOneAndUpdate({ email }, update, { new: true, upsert: false });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ ok: true, addresses: user.addresses });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
