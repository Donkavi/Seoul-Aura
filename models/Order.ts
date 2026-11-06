import mongoose, { Schema, Document, Model } from "mongoose";
import { DELIVERY_STATUSES, type DeliveryStatus } from "@/lib/deliveryStatus";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orderStatus";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

/** One recorded leg of the parcel's journey, kept for the tracking timeline. */
export interface IOrderDeliveryEvent {
  status: DeliveryStatus;
  note?: string;
  at: Date;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  /** Courier calls this on delivery. Older orders were placed without one. */
  phoneNumber?: string;
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  /** Total saved against compare-at prices. Reporting only — not deducted from total. */
  savings: number;
  total: number;
  status: OrderStatus;
  orderType: "standard" | "subscription";
  subscriptionPlan?: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    district: string;
    city: string;
    province?: string;
    postalCode?: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  notes?: string;
  /** When the buyer agreed to pay the delivery charge up front to confirm the order. */
  termsAcceptedAt?: Date;
  /** Bank slip for the delivery charge, uploaded by the buyer. */
  deliveryFeeReceipt?: { url: string; uploadedAt: Date };
  /** Admin has checked the slip and the delivery charge is in. */
  deliveryFeePaid: boolean;
  adminNotes?: string;
  /** Current leg of the delivery journey — unset until the parcel ships. */
  deliveryStatus?: DeliveryStatus;
  deliveryEvents: IOrderDeliveryEvent[];
  /** Unguessable handle for the public /track page. */
  trackingToken?: string;
  estimatedDeliveryDate?: Date;
  estimatedDeliveryMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderDeliveryEventSchema = new Schema<IOrderDeliveryEvent>(
  {
    status: { type: String, enum: DELIVERY_STATUSES, required: true },
    note: { type: String, trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    phoneNumber: { type: String, trim: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String },
      },
    ],
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    orderType: { type: String, enum: ["standard", "subscription"], default: "standard" },
    subscriptionPlan: { type: String },
    shippingAddress: {
      line1: { type: String, required: true },
      line2: { type: String },
      district: { type: String, required: true },
      city: { type: String, required: true },
      province: { type: String },
      postalCode: { type: String },
      country: { type: String, default: "Sri Lanka" },
    },
    paymentMethod: { type: String, enum: ["cod", "bank"], default: "cod" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    notes: { type: String },
    termsAcceptedAt: { type: Date },
    deliveryFeeReceipt: {
      url: { type: String },
      uploadedAt: { type: Date },
    },
    deliveryFeePaid: { type: Boolean, default: false },
    adminNotes: { type: String, trim: true },
    deliveryStatus: { type: String, enum: DELIVERY_STATUSES },
    deliveryEvents: { type: [OrderDeliveryEventSchema], default: [] },
    trackingToken: { type: String, unique: true, sparse: true },
    estimatedDeliveryDate: { type: Date },
    estimatedDeliveryMessage: { type: String, trim: true },
  },
  { timestamps: true }
);

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ customerEmail: 1 });

// Delete cached model so Next.js hot reloads always pick up schema changes
if (mongoose.models.Order) {
  delete (mongoose.models as Record<string, Model<unknown>>)["Order"];
}
const Order = mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
