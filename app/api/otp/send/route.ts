import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Settings from "@/models/Settings";
import { generateOtp, sendOtp, normalizeLkPhone } from "@/lib/notify";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = (session?.user as { email?: string } | undefined)?.email;
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.phoneVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

    // Admin-controlled delivery channel: "sms" (notify.lk) or "email" (Resend)
    const settings = await Settings.findOne().lean<{ otpMethod?: "sms" | "email" }>();
    const method = settings?.otpMethod === "email" ? "email" : "sms";

    // Light throttle: don't allow a new code more than once every 30s
    if (user.otpExpires && user.otpExpires.getTime() - 5 * 60 * 1000 > Date.now() - 30 * 1000) {
      return NextResponse.json({ error: "Please wait a moment before requesting another code" }, { status: 429 });
    }

    let targetPhone = "";
    if (method === "sms") {
      const { phone } = await req.json().catch(() => ({}));
      targetPhone = (phone ?? user.phone ?? "").toString().trim();
      if (!targetPhone || normalizeLkPhone(targetPhone).length < 11) {
        return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
      }
    }

    const code = generateOtp();
    if (method === "sms") user.phone = targetPhone;
    user.otpHash = await bcrypt.hash(code, 10);
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.otpAttempts = 0;
    await user.save();

    const sent =
      method === "email"
        ? await sendOtpEmail(user.email, code, user.name)
        : await sendOtp(targetPhone, code);

    return NextResponse.json({ ok: true, sent, method });
  } catch (err) {
    console.error("[otp/send]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
