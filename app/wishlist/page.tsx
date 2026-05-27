import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";

export default function WishlistPage() {
  return (
    <div className="bg-rose-25/30 min-h-[70vh] flex items-center">
      <div className="max-w-2xl mx-auto px-4 lg:px-8 py-16 text-center">
        <div className="w-20 h-20 mx-auto bg-rose-50 rounded-full flex items-center justify-center mb-6">
          <Heart size={28} className="text-rose-400" strokeWidth={1.5} />
        </div>
        <p className="section-subtitle text-rose-600 mb-3">Your Wishlist</p>
        <h1 className="font-display text-4xl lg:text-5xl text-ink-900 mb-4">
          Save the things you <span className="italic">love</span>
        </h1>
        <p className="text-sm text-ink-500 mb-8 max-w-md mx-auto leading-relaxed">
          Tap the heart icon on any product to add it here. We'll let you know when wishlist items
          go on sale.
        </p>
        <Link href="/shop" className="btn-primary inline-flex items-center gap-2 group">
          Discover Products
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
