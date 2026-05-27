import mongoose, { Schema, Document } from "mongoose";

export interface ISubscriptionPlan extends Document {
  name: string;
  description: string;
  price: number;
  origin: "Korea" | "Dubai" | "Mixed" | "Other";
  items: string[];
  featured: boolean;
  active: boolean;
  badge?: string;
  order: number;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    origin: { type: String, enum: ["Korea", "Dubai", "Mixed", "Other"], default: "Korea" },
    items: [{ type: String }],
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    badge: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.SubscriptionPlan ||
  mongoose.model<ISubscriptionPlan>("SubscriptionPlan", SubscriptionPlanSchema);
