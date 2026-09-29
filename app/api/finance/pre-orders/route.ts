import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import FinanceEntry from "@/models/FinanceEntry";
import PreOrder from "@/models/PreOrder";
import { PRE_ORDER_SALE_STATUSES, parseLedgerDate, roundMoney, todayInput } from "@/lib/finance";
import type { UnrecordedPreOrder } from "@/types";

export const dynamic = "force-dynamic";

interface LeanPreOrder {
  _id: { toString(): string };
  requestNumber: string;
  customerName: string;
  status: UnrecordedPreOrder["status"];
  createdAt: Date;
  items?: Array<{
    productBrand: string;
    productName: string;
    quantity: number;
    unitPrice?: number;
    availability?: "available" | "unavailable";
  }>;
  balancePaymentMethod?: "cod" | "bank";
  shippingFee?: number;
}

const PAYMENT_METHOD_LABELS = { cod: "Cash on delivery", bank: "Bank transfer" } as const;

/**
 * What the buyer is paying for: available items at their quoted price — the
 * same lines as the admin's Est. Total. The delivery fee is left out, as it
 * was in the spreadsheet.
 */
function saleLines(p: LeanPreOrder) {
  const available = (p.items ?? []).filter((it) => it.availability !== "unavailable");
  const priced = available.filter((it) => it.unitPrice != null);
  return {
    lines: priced.map((it) => ({
      brand: it.productBrand,
      description: it.productName,
      quantity: it.quantity,
      unitPrice: it.unitPrice as number,
    })),
    unpricedCount: available.length - priced.length,
  };
}

async function recordedReferences(): Promise<string[]> {
  return FinanceEntry.distinct("reference", { kind: "sale", reference: { $nin: [null, ""] } });
}

/** Pre-orders the buyer has agreed to pay for that aren't in the sales ledger yet. */
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    const docs = (await PreOrder.find({
      status: { $in: PRE_ORDER_SALE_STATUSES },
      requestNumber: { $nin: await recordedReferences() },
    })
      .sort({ createdAt: -1 })
      .select("requestNumber customerName status createdAt items")
      .lean()) as unknown as LeanPreOrder[];

    const preOrders: UnrecordedPreOrder[] = docs.map((p) => {
      const { lines, unpricedCount } = saleLines(p);
      return {
        _id: p._id.toString(),
        requestNumber: p.requestNumber,
        customerName: p.customerName,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        lines,
        total: roundMoney(lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)),
        unpricedCount,
      };
    });
    return NextResponse.json(preOrders);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** { preOrderId, date? } → one sale line per item. Payment follows the pre-order: "done" means received. */
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    const { preOrderId, date } = await req.json();
    const p = (await PreOrder.findById(preOrderId).lean()) as unknown as LeanPreOrder | null;
    if (!p) return NextResponse.json({ error: "Pre-order not found" }, { status: 404 });
    if (!PRE_ORDER_SALE_STATUSES.includes(p.status)) {
      return NextResponse.json({ error: `${p.requestNumber} is ${p.status}, not confirmed yet` }, { status: 400 });
    }
    if (await FinanceEntry.exists({ kind: "sale", reference: p.requestNumber })) {
      return NextResponse.json({ error: `${p.requestNumber} is already recorded` }, { status: 409 });
    }

    const { lines } = saleLines(p);
    if (!lines.length) {
      return NextResponse.json({ error: `${p.requestNumber} has no quoted, available items to record` }, { status: 400 });
    }

    const saleDate = parseLedgerDate(date) ?? parseLedgerDate(todayInput())!;
    const entries = await FinanceEntry.insertMany(
      lines.map((l) => ({
        kind: "sale",
        date: saleDate,
        description: l.description,
        brand: l.brand,
        quantity: l.quantity,
        unitPrice: roundMoney(l.unitPrice),
        amount: roundMoney(l.quantity * l.unitPrice),
        reference: p.requestNumber,
        customer: p.customerName,
        paymentStatus: p.status === "done" ? "paid" : "pending",
        paymentMethod: p.balancePaymentMethod ? PAYMENT_METHOD_LABELS[p.balancePaymentMethod] : undefined,
        deliveryFeeCharged: (p.shippingFee ?? 0) > 0,
        createdBy: session.user?.email ?? "unknown",
      }))
    );
    return NextResponse.json(entries, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
