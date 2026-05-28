import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await connectDB();
    const admins = await Admin.find().sort({ createdAt: 1 }).lean();
    return NextResponse.json(admins);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { email, name } = await req.json();
    if (!email?.trim()) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const admin = await Admin.create({
      email: email.trim().toLowerCase(),
      name: name?.trim() ?? "",
      addedBy: session.user?.email ?? "unknown",
    });
    return NextResponse.json(admin, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) return NextResponse.json({ error: "Admin already exists" }, { status: 409 });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
