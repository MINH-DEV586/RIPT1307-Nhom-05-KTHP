import mongoose, { Schema, Document } from "mongoose";

export interface IMedicalRecord extends Document {
  patient: string; // Better Auth uses string IDs
  doctor: string;  // Better Auth uses string IDs
  date: Date;
  symptoms: string;
  diagnosis: string;
  treatmentPlan: string;
  notes?: string;
  attachments?: string[];
}

const MedicalRecordSchema: Schema = new Schema(
  {
    // Store as String since Better Auth user IDs are strings, not ObjectIds
    patient: { type: String, required: true },
    doctor: { type: String, required: true },
    date: { type: Date, default: Date.now },
    symptoms: { type: String, required: true },
    diagnosis: { type: String, required: true },
    treatmentPlan: { type: String, required: true },
    notes: { type: String },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IMedicalRecord>("MedicalRecord", MedicalRecordSchema);
