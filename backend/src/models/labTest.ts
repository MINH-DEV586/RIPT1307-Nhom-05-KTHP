import mongoose, { Schema, Document } from "mongoose";

export interface ILabTest extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  duration: string;
  isActive: boolean;
}

const LabTestSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, default: 0 },
    category: { type: String, default: "Xét nghiệm" },
    duration: { type: String, default: "30 phút" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ILabTest>("LabTest", LabTestSchema);
