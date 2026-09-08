import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import Product from "@/models/Product";
import Review from "@/models/Review";
import PreOrder from "@/models/PreOrder";

// Always compute fresh from the DB — never cache at build time
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();

    const [
      totalOrders,
      totalPreOrders,
      doneRevenueResult,
      totalUsers,
      totalProducts,
      pendingOrders,
      pendingReviews,
      pendingPreOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      PreOrder.countDocuments(),
      /**
       * Revenue is the money actually collected, which for this store means
       * pre-orders that reached "done" — nothing earlier is settled.
       *
       * Per request it is the same figure the buyer approved and the admin sees
       * as Est. Total: available items at their quoted unit price, times
       * quantity, plus the delivery charge. Items marked unavailable were never
       * charged for, so they are excluded. `estimatedPrice` is the fallback for
       * older requests quoted as a single manual figure with no priced items.
       */
      PreOrder.aggregate([
        { $match: { status: "done" } },
        {
          $project: {
            revenue: {
              $let: {
                vars: {
                  itemsTotal: {
                    $reduce: {
                      input: {
                        $filter: {
                          input: { $ifNull: ["$items", []] },
                          as: "it",
                          cond: { $ne: ["$$it.availability", "unavailable"] },
                        },
                      },
                      initialValue: 0,
                      in: {
                        $add: [
                          "$$value",
                          {
                            $multiply: [
                              { $ifNull: ["$$this.unitPrice", 0] },
                              { $ifNull: ["$$this.quantity", 1] },
                            ],
                          },
                        ],
                      },
                    },
                  },
                },
                in: {
                  $cond: [
                    { $gt: ["$$itemsTotal", 0] },
                    { $add: ["$$itemsTotal", { $ifNull: ["$shippingFee", 0] }] },
                    { $ifNull: ["$estimatedPrice", 0] },
                  ],
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

    const totalRevenue = doneRevenueResult[0]?.total ?? 0;

    return NextResponse.json({
      totalOrders,
      totalPreOrders,
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
