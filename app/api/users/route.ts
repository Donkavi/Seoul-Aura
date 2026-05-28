import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "100");

    const email = searchParams.get("email");
    const query: Record<string, unknown> = {};
    if (status && status !== "all") query.subscriptionStatus = status;
    if (email) {
      query.email = { $regex: `^${email}$`, $options: "i" };
    } else if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);
    return NextResponse.json({ users, total });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
