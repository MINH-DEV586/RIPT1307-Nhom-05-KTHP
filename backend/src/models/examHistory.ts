import mongoose, { Schema, Document } from "mongoose";

// Model lưu lịch sử kết quả khám ngoại trú
export interface IExamHistory extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  examDate: Date;
  chiefComplaint: string;   // Lý do khám
  symptoms: string;
  diagnosis: string;
  treatment: string;        // Hướng xử trí
  prescription?: string;    // Toa thuốc / ghi chú kê đơn
  followUpDate?: Date;      // Lịch tái khám
  notes?: string;
  visitType: "outpatient";  // Khám ngoại trú
}

const ExamHistorySchema: Schema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
