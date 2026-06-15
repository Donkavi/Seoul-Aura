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
      preOrderRevenueResult,
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
      // Fulfilled pre-order revenue: use estimatedPrice if set, else sum item unit prices
      PreOrder.aggregate([
        { $match: { status: "fulfilled" } },
        {
          $project: {
            revenue: {
              $cond: {
                if: { $gt: [{ $ifNull: ["$estimatedPrice", 0] }, 0] },
                then: "$estimatedPrice",
                else: {
                  $reduce: {
                    input: { $ifNull: ["$items", []] },
                    initialValue: 0,
                    in: {
                      $add: [
                        "$$value",
                        { $multiply: [{ $ifNull: ["$$this.unitPrice", 0] }, "$$this.quantity"] },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        { $group: { _id: null, total: { $sum: "$revenue" } } },
      ]),
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Review.countDocuments({ isApproved: false, flagged: false }),
      PreOrder.countDocuments({ status: { $in: ["pending", "reviewing"] } }),
    ]);

    const totalRevenue = (revenueResult[0]?.total ?? 0) + (preOrderRevenueResult[0]?.total ?? 0);

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
