import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  customerName: string;
  customerEmail: string;
  phoneNumber?: string;
  planId: string;
  planName: string;
  planPrice: number;
  origin: "Korea" | "Dubai" | "Mixed" | "Other";
  status: "active" | "paused" | "cancelled";
  startDate: Date;
  nextBillingDate: Date;
  shippingAddress: {
    line1: string;
    city: string;
    country: string;
  };
  notes?: string;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    phoneNumber: { type: String, trim: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    planPrice: { type: Number, required: true, min: 0 },
    origin: { type: String, enum: ["Korea", "Dubai", "Mixed", "Other"], default: "Korea" },
    status: { type: String, enum: ["active", "paused", "cancelled"], default: "active" },
    startDate: { type: Date, default: Date.now },
    nextBillingDate: { type: Date, required: true },
    shippingAddress: {
      line1: { type: String, default: "" },
      city: { type: String, default: "" },
      country: { type: String, default: "Sri Lanka" },
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const Subscription =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);

export default Subscription;
