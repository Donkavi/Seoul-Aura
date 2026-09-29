import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * A business owner, for Admin › Finance. Ledger entries refer to a partner by
 * `name` (in `paidBy`), so renaming one rewrites those entries too.
 */
export interface IPartner extends Document {
  name: string;
  /** Share of net profit, 0–100. */
  sharePercent: number;
  /** Inactive partners stay in the history but drop out of "Paid by" pickers. */
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerSchema = new Schema<IPartner>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    sharePercent: { type: Number, default: 0, min: 0, max: 100 },
    active: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

if (mongoose.models.Partner) {
  delete (mongoose.models as Record<string, Model<unknown>>)["Partner"];
}
const Partner = mongoose.model<IPartner>("Partner", PartnerSchema);

export default Partner;
