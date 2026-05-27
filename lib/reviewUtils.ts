import Review from "@/models/Review";
import Product from "@/models/Product";

export async function recalculateProductRating(productId: string) {
  const reviews = await Review.find({ productId, isApproved: true });
  if (reviews.length === 0) {
    await Product.findByIdAndUpdate(productId, { averageRating: 0, reviewCount: 0 });
    return;
  }
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Product.findByIdAndUpdate(productId, {
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
  });
}
