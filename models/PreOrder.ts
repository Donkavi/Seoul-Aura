import mongoose, { Schema, Document, Model } from "mongoose";

export type PreOrderStatus =
  | "pending"
  | "reviewing"
  | "confirmed"
  | "rejected"
  | "fulfilled";

export interface IPreOrderItem {
  productBrand: string;
  productName: string;
  productLink?: string;
  productImage?: string;
  quantity: number;
  unitPrice?: number;
}

export interface IPreOrder extends Document {
  requestNumber: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  items: IPreOrderItem[];
  // Legacy single-product fields (mirror the first item)
  productBrand: string;
  productName: string;
  productLink?: string;
  quantity: number;
  origin?: "Korea" | "Dubai" | "Other";
  notes?: string;
  status: PreOrderStatus;
  estimatedPrice?: number;
  estimatedAvailability?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PreOrderItemSchema = new Schema<IPreOrderItem>(
  {
    productBrand: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    productLink: { type: String, trim: true },
    productImage: { type: String },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number },
  },
  { _id: false }
);

const PreOrderSchema = new Schema<IPreOrder>(
  {
    requestNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    items: { type: [PreOrderItemSchema], default: [] },
    // Legacy single-product fields — mirror items[0] for list views & old records
    productBrand: { type: String, trim: true },
    productName: { type: String, trim: true },
    productLink: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    origin: { type: String, enum: ["Korea", "Dubai", "Other"], default: "Other" },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "reviewing", "confirmed", "rejected", "fulfilled"],
      default: "pending",
    },
    estimatedPrice: { type: Number },
    estimatedAvailability: { type: String },
    adminNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

PreOrderSchema.index({ status: 1, createdAt: -1 });
PreOrderSchema.index({ customerEmail: 1 });

if (mongoose.models.PreOrder) {
  delete (mongoose.models as Record<string, Model<unknown>>)["PreOrder"];
}
const PreOrder = mongoose.model<IPreOrder>("PreOrder", PreOrderSchema);

export default PreOrder;
