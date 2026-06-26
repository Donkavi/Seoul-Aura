import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotifier extends Document {
  email: string;
  source: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotifierSchema = new Schema<INotifier>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    source: { type: String, default: "newsletter" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

NotifierSchema.index({ email: 1 }, { unique: true });

const Notifier: Model<INotifier> =
  mongoose.models.Notifier || mongoose.model<INotifier>("Notifier", NotifierSchema);

export default Notifier;
