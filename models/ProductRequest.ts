import mongoose, { Schema, Document, Model } from "mongoose";

export type ProductRequestStatus = "pending" | "sourcing" | "added" | "declined";

export interface IProductRequest extends Document {
  productName: string;
  brand?: string;
  category?: string;
  /** Skin/hair concern the shopper was trying to solve when they asked for this. */
  concern?: string;
  /** Why the assistant suggested it — kept so admins see the buying rationale. */
  reason?: string;
  /** Photos of the wanted product, uploaded by the shopper. */
  images: string[];
  /** Verbatim shopper message that triggered the request. */
  customerMessage?: string;
  customerName?: string;
  customerEmail?: string;
  phoneNumber?: string;
  source: "chat" | "manual";
  status: ProductRequestStatus;
  /** Bumped when a second shopper asks for the same product instead of duplicating the row. */
  requestCount: number;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductRequestSchema = new Schema<IProductRequest>(
  {
    productName: { type: String, required: true, trim: true },
    brand: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    concern: { type: String, trim: true, default: "" },
    reason: { type: String, trim: true, default: "" },
    images: { type: [String], default: [] },
    customerMessage: { type: String, trim: true, default: "" },
    customerName: { type: String, trim: true, default: "" },
    customerEmail: { type: String, lowercase: true, trim: true, default: "" },
    phoneNumber: { type: String, trim: true, default: "" },
    source: { type: String, enum: ["chat", "manual"], default: "chat" },
    status: {
      type: String,
      enum: ["pending", "sourcing", "added", "declined"],
      default: "pending",
    },
    requestCount: { type: Number, default: 1, min: 1 },
    adminNotes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

ProductRequestSchema.index({ status: 1, createdAt: -1 });
ProductRequestSchema.index({ productName: 1, brand: 1 });

if (mongoose.models.ProductRequest) {
  delete (mongoose.models as Record<string, Model<unknown>>)["ProductRequest"];
}
const ProductRequest = mongoose.model<IProductRequest>("ProductRequest", ProductRequestSchema);

export default ProductRequest;
