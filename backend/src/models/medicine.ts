import mongoose, { Schema, Document } from "mongoose";

export interface IMedicine extends Document {
  name: string;
  category: string;
  stock: number;
  unit: string;
  price: number;
  expiryDate: Date;
}

const MedicineSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    price: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMedicine>("Medicine", MedicineSchema);
