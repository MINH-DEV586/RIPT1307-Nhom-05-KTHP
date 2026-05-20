import mongoose from "mongoose";
import Appointment from "./backend/src/models/appointment";

async function run() {
  const app = new Appointment({
    patientId: "some-cuid-1",
    doctorId: "some-cuid-2",
    patientType: "self",
    patientName: "",
    date: new Date("2026-05-25"),
    timeSlot: "09:00",
    type: "offline",
    symptoms: "Headache",
    notes: "",
    files: undefined,
    status: "pending"
  });
  
  try {
    await app.validate();
    console.log("Validation passed");
  } catch(e) {
    console.error("Validation failed:", e);
  }
}
run();
