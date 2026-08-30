import mongoose, { Schema, Document, Model } from "mongoose";

export type PreOrderStatus =
  | "pending"
  | "reviewing"
  | "availability"
  | "confirmed"
  | "rejected"
  | "fulfilled"
  | "done";

export interface IPreOrderPriceChange {
  previousUnitPrice?: number;
  newUnitPrice: number;
  reason: string;
  changedAt: Date;
}

export interface IPreOrderItem {
  productBrand: string;
  productName: string;
  productLink?: string;
  productImage?: string;
  quantity: number;
  unitPrice?: number;
  /** Shop compare-at price when the item came from the bag, for the savings figure. */
  comparePrice?: number;
  /** The very first quoted unit price — never overwritten once set. */
  originalUnitPrice?: number;
  /** Every unit-price revision, oldest first. */
  priceHistory?: IPreOrderPriceChange[];
  availability?: "available" | "unavailable";
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
  balancePaymentMethod?: "cod" | "bank";
  depositPaid?: boolean;
  shippingAddress?: {
    district: string;
    city: string;
  };
  shippingFee?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PreOrderPriceChangeSchema = new Schema<IPreOrderPriceChange>(
  {
    previousUnitPrice: { type: Number },
    newUnitPrice: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PreOrderItemSchema = new Schema<IPreOrderItem>(
  {
    productBrand: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    productLink: { type: String, trim: true },
    productImage: { type: String },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number },
    comparePrice: { type: Number },
    originalUnitPrice: { type: Number },
    priceHistory: { type: [PreOrderPriceChangeSchema], default: [] },
    availability: { type: String, enum: ["available", "unavailable"], default: "available" },
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
      enum: [
        "pending",
        "reviewing",
        "availability",
        "confirmed",
        "rejected",
        "fulfilled",
        "done",
      ],
      default: "pending",
    },
    estimatedPrice: { type: Number },
    estimatedAvailability: { type: String },
    adminNotes: { type: String, trim: true },
    balancePaymentMethod: { type: String, enum: ["cod", "bank"] },
    depositPaid: { type: Boolean, default: false },
    shippingAddress: {
      district: { type: String, trim: true },
      city: { type: String, trim: true },
    },
    shippingFee: { type: Number },
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
