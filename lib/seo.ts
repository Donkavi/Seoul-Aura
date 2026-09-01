/**
 * Canonical origin for the site.
 *
 * Lives here rather than in `app/layout.tsx` because Next only permits a fixed
 * set of exports from a layout file — any extra named export is a build error.
 * Metadata, canonicals, the sitemap and JSON-LD all resolve absolute URLs from
 * this one value so they can never disagree about the host.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.seoulaura.lk")
  .trim()
  .replace(/\/+$/, "");

export const SITE_NAME = "Seoul Aura";
