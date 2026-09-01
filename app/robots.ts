import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Served at /robots.txt.
 *
 * Account, checkout and cart pages are private or per-visitor: indexing them
 * wastes crawl budget on pages that can never rank and would leak order URLs
 * into search results. The API is disallowed for the same reason, except that
 * nothing under /logo or the icons is blocked — the favicon crawler needs those.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/account", "/checkout", "/cart", "/verify-phone"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
