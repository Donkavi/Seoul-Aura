/**
 * Rebuilds the header's "Brands" nav item as "Categories" — the shape the shop
 * needs now that the catalogue covers food as well as cosmetics:
 *
 *   Categories
 *     ├── Skincare        (group)
 *     │     ├── Korean    (link, /shop?type=Cosmetics&origin=Korea)
 *     │     │     └── COSRX, Anua, …   (sub-links, one per live brand)
 *     │     └── Global
 *     │           └── The Ordinary, …
 *     └── Food
 *           ├── Korean    (link, /shop?type=Food&origin=Korea)
 *           └── Global
 *
 * Brand sub-links are read from the brands collection at run time, so the menu
 * matches whatever is active. Only the cosmetics group gets them: nothing in the
 * data says which brands sell food, so those sub-links are left for the admin to
 * add from Admin › Nav Menu.
 *
 * Idempotent — re-running rewrites the same document rather than adding another.
 *
 *   npm run nav:categories
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import NavMenu from "../models/NavMenu";
import Brand from "../models/Brand";

const MONGODB_URI = process.env.MONGODB_URI!;

/** Product/brand `origin` values that belong under each sub-group label. */
const ORIGIN_GROUPS = [
  { label: "Korean", origins: ["Korea"] },
  { label: "Global", origins: ["Global", "Dubai", "Other"] },
];

/** Menu group → the `type` it filters the shop by. */
const GROUPS = [
  { heading: "Skincare", type: "Cosmetics", withBrands: true },
  { heading: "Food", type: "Food", withBrands: false },
];

async function run() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI missing from .env.local");
  await mongoose.connect(MONGODB_URI);

  const brands = await Brand.find({ active: true }).sort({ name: 1 }).lean();

  const columns = GROUPS.map((group) => ({
    heading: group.heading,
    links: ORIGIN_GROUPS.map((og) => ({
      label: og.label,
      href: `/shop?type=${encodeURIComponent(group.type)}&origin=${encodeURIComponent(og.origins[0])}`,
      children: group.withBrands
        ? brands
            .filter((b) => og.origins.includes(b.origin))
            .map((b) => ({ label: b.name.trim(), href: `/brands/${b.slug}` }))
        : undefined,
    })),
  }));

  // The item is found by its old label so an already-converted menu updates in
  // place instead of gaining a duplicate.
  const existing = await NavMenu.findOne({ label: { $in: ["Brands", "Categories"] } });

  if (existing) {
    existing.label = "Categories";
    existing.href = "/shop";
    existing.columns = columns as never;
    await existing.save();
    console.log(`✓ Updated nav item "${existing.label}" (order ${existing.order})`);
  } else {
    const count = await NavMenu.countDocuments();
    await NavMenu.create({ label: "Categories", href: "/shop", order: count, columns });
    console.log("✓ Created nav item \"Categories\"");
  }

  for (const col of columns) {
    console.log(`  · ${col.heading}`);
    for (const link of col.links) {
      console.log(`      ${link.label} — ${link.children?.length ?? 0} sub-links`);
    }
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
