import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDeliveryRate extends Document {
  district: string;
  city: string;
  charge: number;
}

const DeliveryRateSchema = new Schema<IDeliveryRate>(
  {
    district: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    charge: { type: Number, required: true },
  },
  { timestamps: true }
);

DeliveryRateSchema.index({ district: 1, city: 1 }, { unique: true });

const DeliveryRate: Model<IDeliveryRate> =
  mongoose.models.DeliveryRate || mongoose.model<IDeliveryRate>("DeliveryRate", DeliveryRateSchema);

export default DeliveryRate;
