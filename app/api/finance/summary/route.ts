import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import FinanceEntry from "@/models/FinanceEntry";
import Partner from "@/models/Partner";
import PreOrder from "@/models/PreOrder";
import { PRE_ORDER_SALE_STATUSES, dateRangeFilter } from "@/lib/finance";
import { buildSummary, type SummaryBucket } from "@/lib/financeSummary";

export const dynamic = "force-dynamic";

/** Profit, partner and monthly figures for ?from=YYYY-MM-DD&to=YYYY-MM-DD (all time when omitted). */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const match = dateRangeFilter(searchParams.get("from"), searchParams.get("to"));

    const [buckets, partners, recordedRefs] = await Promise.all([
      FinanceEntry.aggregate<SummaryBucket>([
        { $match: match },
        {
          $group: {
            _id: {
              kind: "$kind",
              paidBy: "$paidBy",
              status: "$paymentStatus",
              category: "$category",
              month: { $dateToString: { format: "%Y-%m", date: "$date" } },
            },
            amount: { $sum: "$amount" },
          },
        },
      ]),
      Partner.find().sort({ createdAt: 1 }).lean(),
      FinanceEntry.distinct("reference", { kind: "sale", reference: { $nin: [null, ""] } }),
    ]);

    const unrecordedPreOrders = await PreOrder.countDocuments({
      status: { $in: PRE_ORDER_SALE_STATUSES },
      requestNumber: { $nin: recordedRefs },
    });

    return NextResponse.json(buildSummary(buckets, partners, unrecordedPreOrders));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
