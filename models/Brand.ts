import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBrand extends Document {
  name: string;
  slug: string;
  logo?: string;
  origin: "Korea" | "Dubai" | "Other";
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String, trim: true },
    origin: { type: String, enum: ["Korea", "Dubai", "Other"], default: "Korea" },
    description: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BrandSchema.index({ name: 1 });
BrandSchema.index({ origin: 1 });

if (mongoose.models.Brand) {
  delete (mongoose.models as Record<string, Model<unknown>>)["Brand"];
}
const Brand = mongoose.model<IBrand>("Brand", BrandSchema);

export default Brand;
