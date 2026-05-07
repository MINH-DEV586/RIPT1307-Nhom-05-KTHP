import mongoose, { Schema, Document } from "mongoose";

export interface IDispense extends Document {
  prescriptionId: mongoose.Types.ObjectId;
  dispensedBy: string; // Pharmacist ID
  dispensedAt: Date;
  items: {
    medicineId: mongoose.Types.ObjectId;
    medicineName: string;
    quantity: number;
  }[];
}

const DispenseSchema: Schema = new Schema(
  {
    prescriptionId: { type: Schema.Types.ObjectId, ref: "Prescription", required: true },
    dispensedBy: { type: String, required: true },
    dispensedAt: { type: Date, default: Date.now },
    items: [
      {
        medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
        medicineName: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IDispense>("Dispense", DispenseSchema);
