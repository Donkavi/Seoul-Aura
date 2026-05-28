import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdmin extends Document {
  email: string;
  name?: string;
  addedBy: string;
  createdAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    email:   { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:    { type: String, trim: true },
    addedBy: { type: String, required: true },
  },
  { timestamps: true }
);

const Admin: Model<IAdmin> =
  mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);

export default Admin;
