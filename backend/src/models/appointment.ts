import mongoose, { Schema, Document } from "mongoose";

export interface IAppointment extends Document {
  patientId: string;
  doctorId: string;
  patientType: "self" | "family";
  patientName?: string; // For family members
  date: Date;
  timeSlot: string;
  type: "online" | "offline";
  symptoms: string;
  notes?: string;
  files?: string[];
  status: "pending" | "confirmed" | "cancelled" | "completed";
  meetingLink?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
  {
    patientId: { type: String, required: true },
    doctorId: { type: String, required: true },
    patientType: { type: String, enum: ["self", "family"], default: "self" },
    patientName: { type: String },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    type: { type: String, enum: ["online", "offline"], default: "offline" },
    symptoms: { type: String, required: true },
    notes: { type: String },
    files: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    meetingLink: { type: String },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAppointment>("Appointment", AppointmentSchema);
