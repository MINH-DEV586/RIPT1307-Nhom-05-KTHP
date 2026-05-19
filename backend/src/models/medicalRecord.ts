import mongoose, { Schema, Document } from "mongoose";

export interface IMedicalRecord extends Document {
  patient: string;
  doctor: string;
  date: Date;
  symptoms: string;
  diagnosis: string;
  treatmentPlan: string;
  notes?: string;
  attachments?: string[];
  admissionReason?: string;
  recordType?: "inpatient" | "outpatient";
  prescriptionId?: string;  // ID đơn thuốc liên kết
}

const MedicalRecordSchema: Schema = new Schema(
  {
    patient: { type: String, required: true },
    doctor: { type: String, required: true },
    date: { type: Date, default: Date.now },
    symptoms: { type: String, required: true },
    diagnosis: { type: String, required: true },
    treatmentPlan: { type: String, required: true },
    notes: { type: String },
    attachments: [{ type: String }],
    admissionReason: { type: String },
    recordType: { type: String, enum: ["inpatient", "outpatient"], default: "inpatient" },
    prescriptionId: { type: String },

  },
  { timestamps: true }
);

export default mongoose.model<IMedicalRecord>("MedicalRecord", MedicalRecordSchema);
