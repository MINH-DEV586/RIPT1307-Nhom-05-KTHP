import mongoose, { Schema, Document } from "mongoose";

// 1. Model tin nhắn
export interface IMessage extends Document {
  sessionId: mongoose.Types.ObjectId;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "TelemedicineSession", required: true },
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 2. Model phiên khám từ xa
export interface ITelemedicineSession extends Document {
  patientId: string;
  doctorId: string;
  startTime: Date;
  status: "scheduled" | "active" | "completed" | "cancelled";
  meetingLink?: string; // Cho trường hợp tích hợp Video call sau này
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TelemedicineSessionSchema: Schema = new Schema(
  {
    patientId: { type: String, required: true },
    doctorId: { type: String, required: true },
    startTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },
    meetingLink: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
export const TelemedicineSession = mongoose.model<ITelemedicineSession>("TelemedicineSession", TelemedicineSessionSchema);
