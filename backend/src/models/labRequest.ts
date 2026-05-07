import mongoose, { Schema, Document } from "mongoose";

export interface ILabRequest extends Document {
  patientId: string;
  doctorId: string;
  testType: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LabRequestSchema: Schema = new Schema(
  {
    patientId: { type: String, required: true },
    doctorId: { type: String, required: true },
    testType: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ILabRequest>("LabRequest", LabRequestSchema);
