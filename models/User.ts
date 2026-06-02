import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  image?: string;
  phone?: string;
  phoneVerified: boolean;
  otpHash?: string;
  otpExpires?: Date;
  otpAttempts?: number;
  subscriptionStatus: "none" | "active" | "paused" | "cancelled";
  subscriptionPlan?: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  addresses: Array<{
    label: string;
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String },
    image: { type: String },
    phone: { type: String, trim: true },
    phoneVerified: { type: Boolean, default: false },
    otpHash: { type: String },
    otpExpires: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    subscriptionStatus: {
      type: String,
      enum: ["none", "active", "paused", "cancelled"],
      default: "none",
    },
    subscriptionPlan: { type: String },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    addresses: [
      {
        label: { type: String, default: "Home" },
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        province: { type: String },
        postalCode: { type: String },
        country: { type: String, default: "Sri Lanka" },
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

if (mongoose.models.User) {
  delete (mongoose.models as Record<string, Model<unknown>>)["User"];
}
const User = mongoose.model<IUser>("User", UserSchema);

export default User;
