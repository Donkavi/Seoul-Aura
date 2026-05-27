import mongoose, { Schema, Document } from "mongoose";

export interface IConcern extends Document {
  name: string;
  slug: string;
  description?: string;
  order: number;
}

const ConcernSchema = new Schema<IConcern>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Concern ||
  mongoose.model<IConcern>("Concern", ConcernSchema);
