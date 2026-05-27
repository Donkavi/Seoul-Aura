import mongoose, { Schema, Document } from "mongoose";

export interface INavMenuItem extends Document {
  label: string;
  href: string;
  highlight: boolean;
  order: number;
  columns: Array<{
    _id: string;
    heading: string;
    links: Array<{ label: string; href: string }>;
  }>;
  feature?: {
    title: string;
    description: string;
    image: string;
    href: string;
    cta: string;
  };
}

const NavLinkSchema = new Schema(
  { label: { type: String, required: true }, href: { type: String, required: true } },
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

export default mongoose.models.NavMenuItem ||
  mongoose.model<INavMenuItem>("NavMenuItem", NavMenuSchema);
