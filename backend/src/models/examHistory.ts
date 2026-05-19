import mongoose, { Schema, Document } from "mongoose";

// Better Auth dùng String IDs, không phải ObjectId
export interface IExamHistory extends Document {
  patient: string;
  doctor: string;
  examDate: Date;
  chiefComplaint: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  prescription?: string;
  followUpDate?: Date;
  notes?: string;
  visitType: "outpatient";
}

const ExamHistorySchema: Schema = new Schema(
  {
    // Dùng String thay vì ObjectId — Better Auth user IDs là strings
    patient: { type: String, required: true },
    doctor: { type: String, required: true },
    examDate: { type: Date, default: Date.now },
    chiefComplaint: { type: String, required: true },
    symptoms: { type: String, required: true },
    diagnosis: { type: String, required: true },
    treatment: { type: String, required: true },
    prescription: { type: String },
    followUpDate: { type: Date },
    notes: { type: String },
    visitType: { type: String, default: "outpatient" },
  },
  { timestamps: true }
);

export default mongoose.model<IExamHistory>("ExamHistory", ExamHistorySchema);
