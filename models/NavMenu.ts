import mongoose, { Schema, Document } from "mongoose";

/** Deepest level of the mega menu — a plain link under a sub-group. */
export interface INavSubLink {
  label: string;
  href: string;
}

export interface INavLink {
  label: string;
  href: string;
  /** Present when this link acts as a sub-group heading (e.g. Skincare › Korean). */
  children?: INavSubLink[];
}

export interface INavMenuItem extends Document {
  label: string;
  href: string;
  highlight: boolean;
  order: number;
  columns: Array<{
    _id: string;
    heading: string;
    links: INavLink[];
  }>;
  feature?: {
    title: string;
    description: string;
    image: string;
    href: string;
    cta: string;
  };
}

const NavSubLinkSchema = new Schema<INavSubLink>(
  { label: { type: String, required: true }, href: { type: String, required: true } },
  { _id: false }
);

/**
 * Links carry an optional `children` array so a group can nest one level deeper
 * — Categories › Skincare › Korean › <brands>. The child level is deliberately
 * a separate leaf schema rather than a self-reference: three levels is what the
 * header renders, and a recursive schema would allow depths it cannot show.
 */
const NavLinkSchema = new Schema<INavLink>(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    children: { type: [NavSubLinkSchema], default: undefined },
  },
  { _id: false }
);

const NavColumnSchema = new Schema({
  heading: { type: String, required: true },
  links: [NavLinkSchema],
});

const NavFeatureSchema = new Schema(
  { title: String, description: String, image: String, href: String, cta: String },
  { _id: false }
);

const NavMenuSchema = new Schema<INavMenuItem>(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    highlight: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    columns: [NavColumnSchema],
    feature: NavFeatureSchema,
  },
  { timestamps: true }
);

/**
 * The dev server keeps compiled models between hot reloads, so a cached schema
 * from before `children` existed would silently drop sub-links on save. Drop the
 * cached model and recompile, the same way `models/Brand.ts` does.
 */
if (mongoose.models.NavMenuItem) {
  delete (mongoose.models as Record<string, unknown>)["NavMenuItem"];
}

export default mongoose.model<INavMenuItem>("NavMenuItem", NavMenuSchema);
