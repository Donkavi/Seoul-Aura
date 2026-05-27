import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SubscriptionPlan from "@/models/SubscriptionPlan";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";
    const query = activeOnly ? { active: true } : {};
    const plans = await SubscriptionPlan.find(query).sort({ order: 1 }).lean();
    return NextResponse.json(plans);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const count = await SubscriptionPlan.countDocuments();
    const plan = await SubscriptionPlan.create({ ...body, order: body.order ?? count });
    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
