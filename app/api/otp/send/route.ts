import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { generateOtp, sendOtp, normalizeLkPhone } from "@/lib/notify";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = (session?.user as { email?: string } | undefined)?.email;
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.phoneVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

    const { phone } = await req.json();
    const targetPhone = (phone ?? user.phone ?? "").toString().trim();
    if (!targetPhone || normalizeLkPhone(targetPhone).length < 11) {
      return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
    }

    // Light throttle: don't allow a new code more than once every 30s
    if (user.otpExpires && user.otpExpires.getTime() - 5 * 60 * 1000 > Date.now() - 30 * 1000) {
      return NextResponse.json({ error: "Please wait a moment before requesting another code" }, { status: 429 });
    }

    const code = generateOtp();
    user.phone = targetPhone;
    user.otpHash = await bcrypt.hash(code, 10);
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.otpAttempts = 0;
    await user.save();

    const sent = await sendOtp(targetPhone, code);
    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error("[otp/send]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
