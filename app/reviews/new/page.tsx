import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import WriteReview from "@/components/product/WriteReview";

export const metadata = {
  title: "Write a Review | Seoul Aura",
};

export default function NewReviewPage() {
  return (
    <div className="bg-white min-h-screen">
      <section className="border-b border-ink-100 py-14 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-3">
            Customer Stories
          </p>
          <h1 className="font-display text-4xl lg:text-5xl text-ink-900 mb-4">
            Share Your Experience
          </h1>
          <p className="text-base text-ink-500 max-w-lg mx-auto">
            Tell the Aura family about your journey with us — no specific product required.
            Add a few photos if you&apos;d like.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-rose-600 transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <WriteReview />
      </section>
    </div>
  );
}
