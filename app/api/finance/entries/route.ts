import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import FinanceEntry from "@/models/FinanceEntry";
import { BUSINESS_FUND, dateRangeFilter, isFinanceKind, normalizeEntry } from "@/lib/finance";

export const dynamic = "force-dynamic";

/** ?kinds=purchase,purchase_discount&from=YYYY-MM-DD&to=YYYY-MM-DD — newest first. */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const kinds = (searchParams.get("kinds") ?? "").split(",").filter(isFinanceKind);

    const query: Record<string, unknown> = {
      ...dateRangeFilter(searchParams.get("from"), searchParams.get("to")),
    };
    if (kinds.length) query.kind = { $in: kinds };

    const entries = await FinanceEntry.find(query).sort({ date: -1, createdAt: -1 }).limit(5000).lean();
    return NextResponse.json(entries);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    const body = await req.json();
    if (!isFinanceKind(body.kind)) return NextResponse.json({ error: "Unknown entry type" }, { status: 400 });

    const result = normalizeEntry(body.kind, body);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    const createdBy = session.user?.email ?? "unknown";
    const entry = await FinanceEntry.create({ ...result.entry, createdBy });

    // Stock a partner paid for personally is their investment — the sheet kept
    // it in Owner Investments — so the purchase form can record both at once.
    const e = result.entry;
    if (body.alsoInvestment === true && e.kind === "purchase" && e.paidBy && e.paidBy !== BUSINESS_FUND && e.amount > 0) {
      await FinanceEntry.create({
        kind: "investment",
        date: e.date,
        paidBy: e.paidBy,
        description: `Paid for purchase: ${e.description}`,
        amount: e.amount,
        createdBy,
      });
    }
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
