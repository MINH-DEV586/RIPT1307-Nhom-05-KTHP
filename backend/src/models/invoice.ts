import mongoose, { Schema, Document } from "mongoose";

export interface IInvoice extends Document {
  patientId: string;
  polarCheckoutId?: string; // Links to Polar transaction
  vnpayTxnRef?: string;     // Mã giao dịch VNPay (giả lập)
  status: "draft" | "pending_payment" | "paid";
  isEstimatedInvoice?: boolean;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isEstimated?: boolean;
  }>;
  totalAmount: number;
  createdAt: Date;
}

const InvoiceSchema = new Schema(
  {
    patientId: { type: String, required: true },
    polarCheckoutId: { type: String },
    status: {
      type: String,
      enum: ["draft", "pending_payment", "paid"],
      default: "draft",
    },
    items: [
      {
        description: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number,
        isEstimated: { type: Boolean, default: false },
      },
    ],
    totalAmount: { type: Number, default: 0 },
    vnpayTxnRef: { type: String },
    isEstimatedInvoice: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IInvoice>("Invoice", InvoiceSchema);
