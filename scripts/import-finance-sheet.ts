/**
 * One-off import of the "Financial Monitoring Sheet" spreadsheet into
 * Admin › Finance, so the ledger starts with the full history.
 *
 *   npm run import:finance                          # dry run — prints what it would do
 *   npm run import:finance -- --apply               # writes partners + entries
 *   npm run import:finance -- --apply --replace     # re-import: drops the previous import first
 *   npm run import:finance -- "path/to/sheet.xlsx"  # another copy of the sheet
 *
 * How the sheets map:
 *   Sales                 → sales (payment "Done", or a linked pre-order that's done, = received)
 *   Purchases,
 *   Ramen_Purchases       → purchases (Supplier = who paid; "W,K,C" = the Business Fund)
 *   Purchases Discounts   → purchase discounts
 *   Expenses              → expenses        Business Assets → assets
 *   Owner Investments     → investments (including the stock Tharuka paid for,
 *                           which is how the sheet counted it)
 *   Profit Sharing        → partners and their share %
 *   Owner Summary /
 *   Profit Summary        → not imported; the Finance overview calculates them
 *
 * Every imported entry is tagged `createdBy: "import:<file name>"`, so the
 * whole import can be removed with one deleteMany if needed.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { readFileSync } from "fs";
import { inflateRawSync } from "zlib";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import FinanceEntry from "../models/FinanceEntry";
import Partner from "../models/Partner";
import PreOrder from "../models/PreOrder";
import {
  BUSINESS_FUND,
  formatMoney,
  normalizeEntry,
  roundMoney,
  type FinanceKind,
  type NormalizedEntry,
} from "../lib/finance";
import { buildSummary } from "../lib/financeSummary";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const REPLACE = args.includes("--replace");
const file = path.resolve(args.find((a) => !a.startsWith("--")) ?? "document/Financial Monitoring Sheet.xlsx");
const IMPORT_TAG = `import:${path.basename(file)}`;

// ─── Minimal .xlsx reader (an .xlsx is a zip of XML files) ───────────────────

function unzip(buf: Buffer): Map<string, string> {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("Not an .xlsx (zip) file");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map<string, string>();
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + size);
    files.set(name, (method === 8 ? inflateRawSync(data) : data).toString("utf8"));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");

/** `str.matchAll` as an array — the tsconfig target can't iterate it directly. */
const matches = (str: string, re: RegExp) => Array.from(str.matchAll(re));

const textOf = (xml: string) => decode(matches(xml, /<t[^>]*>([\s\S]*?)<\/t>/g).map((m) => m[1]).join(""));

type Cell = string | number | undefined;
type Row = Record<string, Cell> & { __row: number };

/** Every sheet as rows keyed by normalised header ("qty bought", "cost price", …). */
function readWorkbook(buf: Buffer): Map<string, Row[]> {
  const zip = unzip(buf);
  const shared = matches(zip.get("xl/sharedStrings.xml") ?? "", /<si>([\s\S]*?)<\/si>/g).map((m) => textOf(m[1]));
  const rels = new Map(
    matches(zip.get("xl/_rels/workbook.xml.rels") ?? "", /<Relationship [^>]*>/g).map((m) => [
      /Id="([^"]+)"/.exec(m[0])![1],
      /Target="([^"]+)"/.exec(m[0])![1].replace(/^\/?(xl\/)?/, "xl/"),
    ])
  );

  const sheets = new Map<string, Row[]>();
  for (const m of matches(zip.get("xl/workbook.xml") ?? "", /<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)) {
    const xml = zip.get(rels.get(m[2]) ?? "") ?? "";
    const grid: Array<{ row: number; cells: Map<string, Cell> }> = [];
    for (const r of matches(xml, /<row [^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = new Map<string, Cell>();
      for (const c of matches(r[2], /<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const col = /r="([A-Z]+)\d+"/.exec(c[1])![1];
        const type = /t="([^"]+)"/.exec(c[1])?.[1];
        const inner = c[2] ?? "";
        const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
        let value: Cell;
        if (type === "s" && v != null) value = shared[Number(v)];
        else if (type === "inlineStr") value = textOf(inner);
        else if (type === "str" && v != null) value = decode(v);
        else if (v != null) value = Number(v);
        if (typeof value === "string" && !value.trim()) value = undefined;
        if (value !== undefined) cells.set(col, value);
      }
      grid.push({ row: Number(r[1]), cells });
    }
    const [head, ...body] = grid;
    const header = new Map(
      Array.from(head?.cells ?? []).map(([col, v]) => [col, String(v).trim().toLowerCase().replace(/\s+/g, " ")])
    );
    sheets.set(
      decode(m[1]),
      body
        .filter((r) => r.cells.size > 0)
        .map((r) => {
          const row: Row = { __row: r.row };
          for (const [col, v] of Array.from(r.cells)) if (header.has(col)) row[header.get(col)!] = v;
          return row;
        })
    );
  }
  return sheets;
}

// ─── Cell helpers ────────────────────────────────────────────────────────────

const clean = (v: Cell) => (v == null ? undefined : String(v).replace(/\s+/g, " ").trim() || undefined);
const num = (v: Cell) => (typeof v === "number" ? v : v != null && v !== "" && !isNaN(Number(v)) ? Number(v) : undefined);
/** Excel stores dates as days since 30 Dec 1899. */
const excelDate = (v: Cell) => (typeof v === "number" ? new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000) : undefined);
const iso = (d: Date) => d.toISOString().slice(0, 10);
/** "W,K,C" — several partners chipping in together — is the pooled Business Fund. */
const payer = (v: Cell) => {
  const s = clean(v);
  return !s || s.includes(",") ? BUSINESS_FUND : s;
};
const titleCase = (s?: string) =>
  !s ? undefined : s.toLowerCase() === "sms" ? "SMS" : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** The Purchases sheet used its Brand column for costs too ("Shipping", "Delivery", …). */
function purchaseBrandAndCategory(brand?: string, item?: string): { brand?: string; category: string } {
  const b = brand?.toLowerCase();
  if (b === "delivery") return { category: "Korea Delivery" };
  if (b === "shipping") return { category: "Shipping" };
  if (b?.includes("ramen") || item?.toLowerCase().startsWith("ramen")) return { brand: b === "ramen" ? undefined : brand, category: "Ramen" };
  if (!brand && /bag|box|tape|wrap/i.test(item ?? "")) return { category: "Packaging" };
  return { brand: brand && brand.toLowerCase() !== item?.toLowerCase() ? brand : undefined, category: "Product" };
}

// ─── Import ──────────────────────────────────────────────────────────────────

interface PreOrderInfo {
  requestNumber: string;
  customerName: string;
  status: string;
  createdAt: Date;
  balancePaymentMethod?: "cod" | "bank";
}

async function main() {
  const sheets = readWorkbook(readFileSync(file));
  const sheet = (name: string) => sheets.get(name) ?? [];
  const notes: string[] = [];
  const entries: NormalizedEntry[] = [];

  const add = (kind: FinanceKind, raw: Record<string, unknown>, where: string) => {
    const result = normalizeEntry(kind, raw);
    if ("error" in result) notes.push(`skipped ${where}: ${result.error}`);
    else entries.push(result.entry);
  };

  await mongoose.connect(process.env.MONGODB_URI!);

  // Pre-orders fill in the buyer's name, payment method and any missing dates.
  const refs = sheet("Sales").map((r) => clean(r["buyer"])).filter((r): r is string => !!r);
  const preOrders = new Map(
    ((await PreOrder.find({ requestNumber: { $in: refs } })
      .select("requestNumber customerName status createdAt balancePaymentMethod")
      .lean()) as unknown as PreOrderInfo[]).map((p) => [p.requestNumber, p])
  );

  // ── Sales
  const salesDates = new Map<string, Date>();
  for (const r of sheet("Sales")) {
    const ref = clean(r["buyer"]);
    const d = excelDate(r["date"]);
    if (ref && d && !salesDates.has(ref)) salesDates.set(ref, d);
  }
  let lastSaleDate: Date | undefined;
  for (const r of sheet("Sales")) {
    const where = `Sales row ${r.__row}`;
    const ref = clean(r["buyer"]);
    const po = ref ? preOrders.get(ref) : undefined;
    let date = excelDate(r["date"]);
    if (!date) {
      date = (ref && salesDates.get(ref)) || po?.createdAt || lastSaleDate;
      if (date) notes.push(`${where}: no date in the sheet, used ${iso(date)}`);
    }
    lastSaleDate = date ?? lastSaleDate;

    const qty = num(r["qty"]) ?? 1;
    let price = num(r["selling price"]) ?? (num(r["total"]) != null ? num(r["total"])! / qty : undefined);
    let note: string | undefined;
    if (price == null) {
      price = 0;
      note = "No price in the spreadsheet — update when known";
      notes.push(`${where}: "${clean(r["item"])}" has no price, imported at Rs. 0 to be filled in`);
    }
    add(
      "sale",
      {
        date: date && iso(date),
        description: clean(r["item"]),
        brand: clean(r["brand"]),
        quantity: qty,
        unitPrice: price,
        reference: ref,
        customer: po?.customerName,
        paymentStatus: /done/i.test(clean(r["full payment"]) ?? "") || po?.status === "done" ? "paid" : "pending",
        paymentMethod: po?.balancePaymentMethod === "cod" ? "Cash on delivery" : po?.balancePaymentMethod === "bank" ? "Bank transfer" : undefined,
        deliveryFeeCharged: /yes/i.test(clean(r["with deliver fee or not"]) ?? ""),
        notes: note,
      },
      where
    );
  }

  // ── Purchases (the ramen box sheet has the same columns)
  for (const sheetName of ["Purchases", "Ramen_Purchases"]) {
    let lastDate: Date | undefined;
    for (const r of sheet(sheetName)) {
      const where = `${sheetName} row ${r.__row}`;
      const item = clean(r["item"]);
      const qty = num(r["qty bought"]);
      const cost = num(r["cost price"]);
      const total = num(r["total cost"]);
      if (qty == null && cost == null && total == null) {
        notes.push(`skipped ${where}: "${item}" has no amounts${/discount/i.test(item ?? "") ? " (it's in Purchases Discounts)" : ""}`);
        continue;
      }
      let date = excelDate(r["date"]);
      if (!date && lastDate) {
        date = lastDate;
        notes.push(`${where}: no date in the sheet, used the row above's (${iso(date)})`);
      }
      lastDate = date ?? lastDate;
      const status = clean(r["status"]);
      add(
        "purchase",
        {
          date: date && iso(date),
          description: item,
          ...purchaseBrandAndCategory(clean(r["brand"]), item),
          quantity: qty ?? 1,
          unitPrice: cost ?? (total != null ? total / (qty ?? 1) : undefined),
          paidBy: payer(r["supplier"]),
          // Blank meant nothing owed — every row was counted as money spent.
          paymentStatus: !status || /done|paid/i.test(status) ? "paid" : "pending",
          paymentMethod: clean(r["payment method"]),
          source: clean(r["purchase from"]),
        },
        where
      );
    }
  }

  // ── Purchase discounts
  for (const r of sheet("Purchases Discounts")) {
    add(
      "purchase_discount",
      {
        date: excelDate(r["date"]) && iso(excelDate(r["date"])!),
        paidBy: payer(r["supplier"]),
        description: clean(r["discount reason"]),
        amount: num(r["disocunt price"] ?? r["discount price"]),
      },
      `Purchases Discounts row ${r.__row}`
    );
  }

  // ── Expenses & business assets
  for (const [sheetName, kind] of [["Expenses", "expense"], ["Business Assets", "asset"]] as const) {
    for (const r of sheet(sheetName)) {
      add(
        kind,
        {
          date: excelDate(r["date"]) && iso(excelDate(r["date"])!),
          paidBy: payer(r["owner"]),
          description: clean(r["description"]),
          category: titleCase(clean(r["category"])),
          amount: num(r["amount"]),
        },
        `${sheetName} row ${r.__row}`
      );
    }
  }

  // ── Investments
  for (const r of sheet("Owner Investments")) {
    add(
      "investment",
      {
        date: excelDate(r["date"]) && iso(excelDate(r["date"])!),
        paidBy: clean(r["owner"]),
        description: clean(r["description"]),
        amount: num(r["amount invested"]),
      },
      `Owner Investments row ${r.__row}`
    );
  }

  // ── Partners
  const partners = sheet("Profit Sharing")
    .map((r) => {
      const share = num(r["share %"]) ?? 0;
      return { name: clean(r["owner"]), sharePercent: roundMoney(share <= 1 ? share * 100 : share) };
    })
    .filter((p): p is { name: string; sharePercent: number } => !!p.name);

  // ── Report — through the same calculation as the Finance overview, so these
  // are the figures the admin panel will show once imported.
  const total = (kind: FinanceKind) => roundMoney(entries.filter((e) => e.kind === kind).reduce((s, e) => s + e.amount, 0));
  const count = (kind: FinanceKind) => entries.filter((e) => e.kind === kind).length;
  const summary = buildSummary(
    entries.map((e) => ({
      _id: { kind: e.kind, paidBy: e.paidBy, status: e.paymentStatus, category: e.category, month: iso(e.date).slice(0, 7) },
      amount: e.amount,
    })),
    partners.map((p) => ({ ...p, active: true })),
    0
  );
  const t = summary.totals;

  console.log(`\nFinance import from ${path.basename(file)}${APPLY ? "" : "  (dry run — nothing is written)"}\n`);
  for (const kind of ["sale", "purchase", "purchase_discount", "expense", "asset", "investment"] as FinanceKind[]) {
    console.log(`  ${kind.padEnd(18)} ${String(count(kind)).padStart(3)} entries  ${formatMoney(total(kind))}`);
  }
  console.log(`\nSales ${formatMoney(t.sales)} (received ${formatMoney(t.salesReceived)}, awaiting ${formatMoney(t.salesPending)})`);
  console.log(`− net purchases ${formatMoney(t.netPurchases)} − expenses ${formatMoney(t.expenses)} = net profit ${formatMoney(t.netProfit)}`);

  console.log("\nPartners:");
  for (const p of summary.partners) {
    console.log(
      `  ${p.name.padEnd(10)} ${String(p.sharePercent).padStart(3)}%  capital ${formatMoney(p.capital)}, ` +
        `expenses ${formatMoney(p.expenses)}, assets ${formatMoney(p.assets)} = ${formatMoney(p.total)}  → profit share ${formatMoney(p.profitShare)}`
    );
  }
  const fund = summary.businessFund;
  console.log(`  ${BUSINESS_FUND}: purchases ${formatMoney(fund.purchases)}, expenses ${formatMoney(fund.expenses)}, assets ${formatMoney(fund.assets)}`);

  console.log("\nBy month:");
  for (const m of summary.monthly) {
    console.log(`  ${m.month}  sales ${formatMoney(m.sales)}, net purchases ${formatMoney(m.netPurchases)}, expenses ${formatMoney(m.expenses)} → ${formatMoney(m.netProfit)}`);
  }

  if (notes.length) {
    console.log("\nNotes:");
    for (const n of notes) console.log(`  ${n}`);
  }

  if (!APPLY) {
    console.log(`\nRun again with --apply to write ${entries.length} entries and ${partners.length} partners.\n`);
    return;
  }

  const previous = await FinanceEntry.countDocuments({ createdBy: IMPORT_TAG });
  if (previous > 0 && !REPLACE) {
    console.log(`\n${previous} entries from an earlier import of this file are already in the ledger.`);
    console.log("Nothing written. Add --replace to remove those and import again.\n");
    return;
  }
  if (previous > 0) {
    await FinanceEntry.deleteMany({ createdBy: IMPORT_TAG });
    console.log(`\nRemoved ${previous} entries from the earlier import.`);
  }

  for (const p of partners) {
    const res = await Partner.updateOne({ name: p.name }, { $setOnInsert: { ...p, active: true } }, { upsert: true });
    console.log(res.upsertedCount ? `Added partner ${p.name} (${p.sharePercent}%)` : `Partner ${p.name} already exists — left as is`);
  }
  await FinanceEntry.insertMany(entries.map((e) => ({ ...e, createdBy: IMPORT_TAG })));
  console.log(`Imported ${entries.length} entries.\n`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
