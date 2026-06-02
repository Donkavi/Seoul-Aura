import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = (session?.user as { email?: string } | undefined)?.email;
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.phoneVerified) return NextResponse.json({ ok: true });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "Enter the code" }, { status: 400 });

    if (!user.otpHash || !user.otpExpires || user.otpExpires.getTime() < Date.now()) {
      return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
    }
    if ((user.otpAttempts ?? 0) >= 5) {
      return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
    }

    const match = await bcrypt.compare(String(code).trim(), user.otpHash);
    if (!match) {
      user.otpAttempts = (user.otpAttempts ?? 0) + 1;
      await user.save();
      return NextResponse.json({ error: "Incorrect code. Try again." }, { status: 400 });
    }

    user.phoneVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[otp/verify]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
