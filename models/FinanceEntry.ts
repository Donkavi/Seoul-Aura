import mongoose, { Schema, Document, Model } from "mongoose";
import {
  FINANCE_KINDS,
  PAYMENT_STATUSES,
  type FinanceKind,
  type FinancePaymentStatus,
} from "@/lib/finance";

/**
 * One line in the business ledger (Admin › Finance). Every sheet of the old
 * "Financial Monitoring Sheet" maps onto a `kind`, so totals for the profit and
 * partner summaries come from a single collection. See `normalizeEntry` for
 * which fields apply to which kind.
 */
export interface IFinanceEntry extends Document {
  kind: FinanceKind;
  /** Calendar day, stored as UTC midnight. */
  date: Date;
  /** Item sold/bought, what an expense was for, or a discount's reason. */
  description: string;
  /** Line total in LKR — quantity × unitPrice for sales and purchases. */
  amount: number;
  quantity?: number;
  /** Selling price (sale) or cost price (purchase), per unit, in LKR. */
  unitPrice?: number;
  /** Purchase cost per unit in Korean won, when it was bought in KRW. */
  unitPriceKRW?: number;
  brand?: string;
  category?: string;
  /** Partner name or BUSINESS_FUND. For an investment, the partner who invested. */
  paidBy?: string;
  /** Pre-order request number (PRE-…) the line belongs to. */
  reference?: string;
  /** Buyer's name on a sale. */
  customer?: string;
  paymentStatus?: FinancePaymentStatus;
  paymentMethod?: string;
  /** Where a purchase was bought from (shop or website). */
  source?: string;
  /** The buyer paid a delivery fee on top — kept for reference, not added to the sale. */
  deliveryFeeCharged?: boolean;
  notes?: string;
  /** Admin email, or "import:<file>" for rows brought in from the spreadsheet. */
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinanceEntrySchema = new Schema<IFinanceEntry>(
  {
    kind: { type: String, enum: FINANCE_KINDS, required: true },
    date: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    quantity: { type: Number, min: 0 },
    unitPrice: { type: Number, min: 0 },
    unitPriceKRW: { type: Number, min: 0 },
    brand: { type: String, trim: true },
    category: { type: String, trim: true },
    paidBy: { type: String, trim: true },
    reference: { type: String, trim: true },
    customer: { type: String, trim: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES },
    paymentMethod: { type: String, trim: true },
    source: { type: String, trim: true },
    deliveryFeeCharged: { type: Boolean },
    notes: { type: String, trim: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

FinanceEntrySchema.index({ kind: 1, date: -1 });
FinanceEntrySchema.index({ reference: 1 });
FinanceEntrySchema.index({ paidBy: 1 });

if (mongoose.models.FinanceEntry) {
  delete (mongoose.models as Record<string, Model<unknown>>)["FinanceEntry"];
}
const FinanceEntry = mongoose.model<IFinanceEntry>("FinanceEntry", FinanceEntrySchema);

export default FinanceEntry;
