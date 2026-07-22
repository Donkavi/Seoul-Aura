import { NextRequest, NextResponse } from "next/server";

// Live KRW→LKR (or any pair) rate from a free, no-key provider.
// Cached for 1 hour to avoid hammering the upstream API.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = (searchParams.get("from") ?? "KRW").toUpperCase();
    const to = (searchParams.get("to") ?? "LKR").toUpperCase();

    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Upstream error");
    const data = await res.json();

    const rate = data?.rates?.[to];
    if (data?.result !== "success" || typeof rate !== "number") {
      return NextResponse.json({ error: "Rate unavailable" }, { status: 502 });
    }

    return NextResponse.json({
      from,
      to,
      rate,
      updated: data.time_last_update_utc ?? null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch live rate" }, { status: 502 });
  }
}
