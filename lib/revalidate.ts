import { revalidatePath } from "next/cache";

/**
 * Drops the cached pages that render the catalogue.
 *
 * Product writes go straight to Mongo, so nothing else tells Next that a page
 * it generated earlier is now wrong. Without this, an admin edit stays
 * invisible on the live site until that page's own revalidate window lapses —
 * an hour for the brand pages, which is long enough to look like a bug.
 *
 * Brand and product pages are invalidated by route pattern rather than by slug:
 * a product can be renamed or moved between brands, which leaves the old page
 * stale too, and the caller rarely knows what the previous values were.
 *
 * Revalidation is best-effort. A product must still save even if dropping the
 * cache fails, so failures are logged rather than propagated.
 */
export function revalidateCatalogue() {
  try {
    for (const path of ["/", "/shop", "/brands", "/sitemap.xml"]) {
      revalidatePath(path);
    }
    revalidatePath("/brands/[slug]", "page");
    revalidatePath("/shop/[id]", "page");
  } catch (err) {
    console.error("[revalidateCatalogue]", err);
  }
}
