import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductVariant {
  name: string;
  price: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  comparePrice?: number;
  origin: "Korea" | "Dubai" | "Other";
  type: string;
  subtype: string;
  images: string[];
  stock: number;
  sku?: string;
  brand?: string;
  tags: string[];
  concerns: string[];
  variants: IProductVariant[];
  isPreOrder: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number },
    origin: { type: String, enum: ["Korea", "Dubai", "Other"], required: true },
    type: { type: String, required: true },
    subtype: { type: String, required: true },
    images: [{ type: String }],
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String },
    tags: [{ type: String }],
    brand: { type: String, trim: true },
    concerns: [{ type: String }],
    variants: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    isPreOrder: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ type: 1, subtype: 1 });
ProductSchema.index({ origin: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isBestSeller: 1 });

// Delete cached model so Next.js hot reloads always pick up schema changes
if (mongoose.models.Product) {
  delete (mongoose.models as Record<string, Model<unknown>>)["Product"];
}
const Product = mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
