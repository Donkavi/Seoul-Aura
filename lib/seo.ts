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

/** Trims to a word boundary so a description never ends mid-word. */
export function clamp(text: string, limit: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, "")}…`;
}

/**
 * "Dr.Althea" + "Dr.Althea 345 Relief Cream" would read as the brand twice. Most
 * product names in this catalogue already lead with the brand, so only prefix it
 * when it is genuinely missing.
 */
export function withBrand(name: string, brand?: string): string {
  if (!brand?.trim()) return name;
  const normalise = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalise(name).startsWith(normalise(brand)) ? name : `${brand.trim()} ${name}`;
}

/**
 * Title and description for a brand page.
 *
 * An admin-written `metaTitle`/`metaDescription` always wins; the generated
 * fallback exists so a brand added at 2am still ships a unique, query-shaped
 * title instead of inheriting the shop's. The generated title mirrors what
 * people actually search — "anua sri lanka", "buy anua toner colombo" — rather
 * than the bare brand name, which competes with the brand's own .com.
 */
export function brandSeo(brand: {
  name: string;
  origin?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}): { title: string; description: string } {
  const name = brand.name.trim();
  const origin = brand.origin === "Dubai" ? "Middle Eastern" : "Korean";

  const title =
    brand.metaTitle?.trim() || `${name} Sri Lanka — Authentic ${origin} Skincare Online`;

  const description =
    clamp(brand.metaDescription?.trim() || "", 160) ||
    clamp(brand.description?.trim() || "", 160) ||
    `Shop authentic ${name} in Sri Lanka at Seoul Aura. Genuine ${name} ${origin} skincare imported from Seoul, delivered islandwide with cash on delivery.`;

  return { title, description };
}
