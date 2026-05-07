import mongoose, { Schema, Document } from "mongoose";

export interface ILabIndicator {
  name: string;
  value: number;
  unit: string;
  normalRange: string;
}

export interface ILabResult extends Document {
  patient: string; // ID from Better-Auth (string)
  labRequestId?: mongoose.Types.ObjectId;
  uploadedBy: string; // Doctor or Lab Tech ID
  testType: string; // e.g., 'X-Ray', 'MRI', 'Blood Test'
  bodyPart?: string; // e.g., 'Chest', 'Left Knee'
  imageUrl?: string; // The UTApi URL
  aiAnalysis?: string; // AI generated text
  doctorNotes?: string; // Human doctor's conclusion
  indicators?: ILabIndicator[];
  status: "pending" | "analyzed" | "reviewed" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const LabResultSchema: Schema = new Schema(
  {
    patient: { type: String, required: true },
    labRequestId: { type: Schema.Types.ObjectId, ref: "LabRequest" },
    uploadedBy: { type: String, required: true },
    testType: { type: String, required: true },
    bodyPart: { type: String },
    imageUrl: { type: String },
    aiAnalysis: { type: String },
    doctorNotes: { type: String },
    indicators: [
      {
        name: { type: String },
        value: { type: Number },
        unit: { type: String },
        normalRange: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "analyzed", "reviewed", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model<ILabResult>("LabResult", LabResultSchema);
