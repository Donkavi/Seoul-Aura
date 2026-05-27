import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  type: string;
  slug: string;
  subtypes: Array<{ name: string; slug: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    type: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    subtypes: [
      {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, lowercase: true },
      },
    ],
  },
  { timestamps: true }
);

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
