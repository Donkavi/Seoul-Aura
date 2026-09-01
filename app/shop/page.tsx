import type { Metadata } from "next";
import ShopClient from "./ShopClient";

/**
 * The shop index is the page that competes for the broad head terms
 * ("korean cosmetics in sri lanka"), so it needs its own title and description
 * rather than inheriting the site defaults — and it has to say those words in
 * server-rendered HTML, because the product grid below is fetched client-side
 * and is therefore not dependable as indexable text.
 */
export const metadata: Metadata = {
  title: "Korean Cosmetics in Sri Lanka — Authentic K-Beauty Online",
  description:
    "Buy authentic Korean cosmetics and skincare in Sri Lanka. Genuine COSRX, Beauty of Joseon, SKIN1004, Anua, AXIS-Y and The Ordinary — imported from Seoul, delivered islandwide.",
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Korean Cosmetics in Sri Lanka — Authentic K-Beauty Online",
    description:
      "Genuine Korean skincare and cosmetics, imported from Seoul and delivered islandwide across Sri Lanka.",
    url: "/shop",
    type: "website",
  },
};

export default function ShopPage() {
  return (
    <>
      {/* Server-rendered heading and copy. Every competitor ranking for this
          query has exactly this: one clear H1 naming the category and country,
          plus a short block of real text. Visually understated on purpose — it
          sits above the existing filter UI without redesigning it. */}
      <header className="border-b border-ink-100 bg-rose-25/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-10">
          <h1 className="font-display text-3xl lg:text-4xl text-ink-900 tracking-tight">
            Korean Cosmetics in Sri Lanka
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-ink-600 leading-relaxed">
            Shop authentic Korean skincare and K-Beauty, imported directly from Seoul and delivered
            islandwide across Sri Lanka. Browse cleansers, toners, serums, moisturisers and
            sunscreens from <strong className="font-medium text-ink-800">COSRX</strong>,{" "}
            <strong className="font-medium text-ink-800">Beauty of Joseon</strong>,{" "}
            <strong className="font-medium text-ink-800">SKIN1004</strong>,{" "}
            <strong className="font-medium text-ink-800">Anua</strong>,{" "}
            <strong className="font-medium text-ink-800">AXIS-Y</strong> and more — every product
            100% genuine, with cash on delivery available.
          </p>
        </div>
      </header>

      <ShopClient />
    </>
  );
}
