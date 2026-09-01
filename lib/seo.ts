/**
 * Canonical origin for the site.
 *
 * Lives here rather than in `app/layout.tsx` because Next only permits a fixed
 * set of exports from a layout file — any extra named export is a build error.
 * Metadata, canonicals, the sitemap and JSON-LD all resolve absolute URLs from
 * this one value so they can never disagree about the host.
 */
/**
 * Only server code reads this, so the plain `SITE_URL` name is preferred —
 * a `NEXT_PUBLIC_` variable is inlined into the browser bundle, which is
 * pointless here and makes the value look like a secret when it is not.
 * The prefixed name is still honoured so existing deployments keep working.
 */
export const SITE_URL = (
  process.env.SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.seoulaura.lk"
)
  .trim()
  .replace(/\/+$/, "");

export const SITE_NAME = "Seoul Aura";
