import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import Product from "@/models/Product";
import Review from "@/models/Review";
import PreOrder from "@/models/PreOrder";

export async function GET() {
  try {
    await connectDB();

    const [
      totalOrders,
      revenueResult,
      totalUsers,
      totalProducts,
      pendingOrders,
      pendingReviews,
      pendingPreOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Review.countDocuments({ isApproved: false, flagged: false }),
      PreOrder.countDocuments({ status: { $in: ["pending", "reviewing"] } }),
    ]);

    const totalRevenue = revenueResult[0]?.total ?? 0;

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      totalUsers,
      totalProducts,
      pendingOrders,
      pendingReviews,
      pendingPreOrders,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
