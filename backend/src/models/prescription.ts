import mongoose, { Schema, Document } from "mongoose";

export interface IPrescriptionItem {
  medicineId: mongoose.Types.ObjectId;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
}

export interface IPrescription extends Document {
  patientId: string;
  doctorId: string;
  diagnosis: string;
  items: IPrescriptionItem[];
  status: "pending" | "dispensed" | "cancelled";
  notes?: string;
}

const PrescriptionSchema: Schema = new Schema(
  {
    patientId: { type: String, required: true }, // Better-Auth uses string IDs for users
    doctorId: { type: String, required: true },
    diagnosis: { type: String, required: true },
    items: [
      {
        medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
        medicineName: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "dispensed", "cancelled"],
      default: "pending",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IPrescription>("Prescription", PrescriptionSchema);
