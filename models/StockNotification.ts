import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStockNotification extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  email: string;
  name?: string;
  status: "pending" | "notified" | "expired";
  notifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StockNotificationSchema = new Schema<IStockNotification>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "notified", "expired"],
      default: "pending",
    },
    notifiedAt: { type: Date },
  },
  { timestamps: true }
);

StockNotificationSchema.index({ productId: 1, email: 1 }, { unique: true });
StockNotificationSchema.index({ status: 1, productId: 1 });

const StockNotification: Model<IStockNotification> =
  mongoose.models.StockNotification ||
  mongoose.model<IStockNotification>("StockNotification", StockNotificationSchema);

export default StockNotification;
