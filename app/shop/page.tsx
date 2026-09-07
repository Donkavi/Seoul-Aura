import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";
import ShopClient from "./ShopClient";

/**
 * The shop index competes for the broad head terms ("korean cosmetics in sri
 * lanka"), so it carries its own title and description rather than inheriting
 * the site defaults. Those words belong in the head — the page itself shows the
 * collection, not a paragraph written for a crawler.
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

/**
 * Brand collections moved from ?brand=X to /brands/[slug], which is where the
 * brand-specific title, description and copy live. Old links — the sitemap Google
 * already crawled, the saved nav-menu entries, anything shared — are redirected
 * rather than left to render a page whose metadata says something else.
 */
export default function ShopPage({
  searchParams,
}: {
  searchParams: { brand?: string };
}) {
  const brand = searchParams.brand?.trim();
  if (brand) redirect(brand.toLowerCase() === "all" ? "/brands" : `/brands/${slugify(brand)}`);

  return <ShopClient />;
}
