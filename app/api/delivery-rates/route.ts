import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DeliveryRate from "@/models/DeliveryRate";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const district = searchParams.get("district");

    if (district) {
      const cities = await DeliveryRate.find({ district })
        .select("city charge -_id")
        .sort({ city: 1 })
        .lean();
      return NextResponse.json({ cities });
    }

    const districts = await DeliveryRate.distinct("district");
    districts.sort((a: string, b: string) => a.localeCompare(b));
    return NextResponse.json({ districts });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
