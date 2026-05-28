import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const admin = await Admin.findById(params.id);
    if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Prevent removing yourself
    if (admin.email === session?.user?.email?.toLowerCase()) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    await admin.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
