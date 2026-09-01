import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/mongodb";
import ProductModel from "@/models/Product";
import CategoryModel from "@/models/Category";
import ConcernModel from "@/models/Concern";
import BrandModel from "@/models/Brand";
import { SITE_URL } from "@/lib/seo";

/** Rebuilt hourly — new products should not wait for a deploy to be crawlable. */
export const revalidate = 3600;

const STATIC_PATHS: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/pre-order", priority: 0.8, changeFrequency: "weekly" },
  { path: "/subscriptions", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { path: "/reviews/new", priority: 0.3, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
];

/**
 * Served at /sitemap.xml.
 *
 * Product pages carry the real search value, so each one is listed individually
 * with its own `lastModified` — that is how Google learns a price or description
 * changed without recrawling the whole catalogue. Category, concern and brand
 * listings are included because they target the broader "korean sunscreen sri
 * lanka" style queries that individual products do not.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((s) => ({
    url: `${SITE_URL}${s.path}`,
    lastModified: new Date(),
    changeFrequency: s.changeFrequency,
    priority: s.priority,
  }));

  try {
    await connectDB();

    const [products, categories, concerns, brands] = await Promise.all([
      ProductModel.find({ active: true }).select("slug _id updatedAt").lean(),
      CategoryModel.find().select("type subtypes").lean(),
      ConcernModel.find().select("slug").lean(),
      BrandModel.find({ active: true }).select("name").lean(),
    ]);

    for (const p of products as unknown as Array<{ slug?: string; _id: unknown; updatedAt?: Date }>) {
      entries.push({
        url: `${SITE_URL}/shop/${p.slug ?? String(p._id)}`,
        lastModified: p.updatedAt ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const c of categories as unknown as Array<{ type: string; subtypes?: Array<{ name: string }> }>) {
      entries.push({
        url: `${SITE_URL}/shop?type=${encodeURIComponent(c.type)}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
      for (const sub of c.subtypes ?? []) {
        entries.push({
          url: `${SITE_URL}/shop?type=${encodeURIComponent(c.type)}&subtype=${encodeURIComponent(sub.name)}`,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }

    for (const c of concerns as unknown as Array<{ slug: string }>) {
      entries.push({
        url: `${SITE_URL}/shop?concern=${encodeURIComponent(c.slug)}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    for (const b of brands as unknown as Array<{ name: string }>) {
      entries.push({
        url: `${SITE_URL}/shop?brand=${encodeURIComponent(b.name)}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (err) {
    // A database hiccup should still leave a valid sitemap of the static pages
    // rather than a 500 that tells Google the sitemap is broken.
    console.error("sitemap: could not load catalogue", err);
  }

  return entries;
}
