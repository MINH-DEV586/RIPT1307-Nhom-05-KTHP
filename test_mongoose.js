const mongoose = require("mongoose");
const path = require("path");

async function run() {
  await mongoose.connect("mongodb://127.0.0.1:27017/medflow"); // assuming default or wait, what's the URL?
  
  // Actually let's just require the Appointment model and try to validate a fake object
  const Appointment = require("./backend/src/models/appointment").default;
  
  const app = new Appointment({
    patientId: "some-cuid-1",
    doctorId: "some-cuid-2",
    patientType: "self",
    patientName: "",
    date: "2026-05-25",
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
  mongoose.disconnect();
}
run();
