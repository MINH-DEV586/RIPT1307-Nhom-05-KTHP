import mongoose, { Schema, Document } from "mongoose";

export interface IDoctorSchedule extends Document {
  doctorId: string;
  workingDays: string[]; // ['Monday', 'Tuesday', ...]
  workingHours: {
    start: string; // "08:00"
    end: string;   // "17:00"
  };
  breakTime: {
    start: string; // "12:00"
    end: string;   // "13:00"
  };
  maxPatientsPerDay: number;
  slotDuration: number; // in minutes, e.g., 30
}

const DoctorScheduleSchema: Schema = new Schema(
  {
    doctorId: { type: String, required: true, unique: true },
    workingDays: [{ type: String }],
    workingHours: {
      start: { type: String, default: "08:00" },
      end: { type: String, default: "17:00" },
    },
    breakTime: {
      start: { type: String, default: "12:00" },
      end: { type: String, default: "13:00" },
    },
    maxPatientsPerDay: { type: Number, default: 20 },
    slotDuration: { type: Number, default: 30 },
  },
  { timestamps: true }
);

export default mongoose.model<IDoctorSchedule>("DoctorSchedule", DoctorScheduleSchema);
