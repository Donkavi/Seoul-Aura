import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Notifier from "@/models/Notifier";
import { sendCampaignEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as { isAdmin?: boolean } | undefined)?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { subject, message, heading, images, audience } = await req.json();

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
    }
    if (!["users", "notifiers", "both"].includes(audience)) {
      return NextResponse.json({ error: "Invalid audience." }, { status: 400 });
    }

    const emails = new Set<string>();

    if (audience === "users" || audience === "both") {
      const users = await User.find({}).select("email").lean();
      users.forEach((u) => u.email && emails.add(String(u.email).toLowerCase()));
    }
    if (audience === "notifiers" || audience === "both") {
      const notifiers = await Notifier.find({ active: true }).select("email").lean();
      notifiers.forEach((n) => n.email && emails.add(String(n.email).toLowerCase()));
    }

    const recipients = Array.from(emails);
    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found for the selected audience." }, { status: 400 });
    }

    const result = await sendCampaignEmail({
      recipients,
      subject: subject.trim(),
      message,
      heading: heading?.trim() || undefined,
      images: Array.isArray(images) ? images.filter(Boolean) : [],
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Recipient counts for the compose UI
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as { isAdmin?: boolean } | undefined)?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const [users, notifiers] = await Promise.all([
      User.countDocuments({}),
      Notifier.countDocuments({ active: true }),
    ]);
    return NextResponse.json({ users, notifiers });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
