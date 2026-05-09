import mongoose, { Schema, Document } from "mongoose";

export interface IBed extends Document {
  bedNumber: string;
  type: "normal" | "emergency" | "rehab" | "disability" | "vip";
  status: "available" | "occupied" | "maintenance";
  patientId?: string; // Better Auth user ID
  department: string;
  floor: string;
}

const BedSchema: Schema = new Schema(
  {
    bedNumber: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["normal", "emergency", "rehab", "disability", "vip"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
    },
    patientId: { type: String, default: null },
    department: { type: String, required: true },
    floor: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBed>("Bed", BedSchema);
