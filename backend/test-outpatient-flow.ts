import mongoose from "mongoose";
import Appointment from "./src/models/appointment";
import Invoice from "./src/models/invoice";
import Prescription from "./src/models/prescription";
import Medicine from "./src/models/medicine";
import { updateAppointmentStatus } from "./src/controllers/appointment";
import { confirmDispense } from "./src/controllers/dispense";
import type { Request, Response } from "express";

const MONGO_URI = "mongodb+srv://chems2chet_db_user:apperttk@cluster0.zcccoyn.mongodb.net/<db>?appName=OOP";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully!");

    const patientId = "6a13289da990feee8b4d5fc8"; // bn1

    // 1. Reset: Delete all draft/pending_payment invoices for this patient
    await Invoice.deleteMany({ patientId, status: { $in: ["draft", "pending_payment"] } });
    console.log("Cleared old active invoices.");

    // 2. Set patient status to "outpatient" (status is empty/discharged/outpatient)
    const userCollection = mongoose.connection.collection("user");
    await userCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(patientId) },
      { $set: { status: "outpatient", patientType: "outpatient" } }
    );
    console.log("Set patient to outpatient status.");

    // 3. Find/Create a mock appointment
    let appt = await Appointment.findOne({ patientId });
    if (!appt) {
      appt = new Appointment({
        patientId,
        doctorId: "6a132512a990feee8b4d5fc2", // some doctor ID
        patientType: "self",
        patientName: "Patient One",
        date: new Date(),
        timeSlot: "08:00 - 08:30",
        type: "offline",
        symptoms: "Test symptoms",
        status: "confirmed"
      });
      await appt.save();
    } else {
      appt.status = "confirmed";
      await appt.save();
    }
    console.log("Mock appointment prepared ID:", appt._id);

    // 4. Simulate complete appointment
    const req = {
      params: { id: appt._id.toString() },
      body: {
        status: "completed",
        billing: {
          consultationFee: 250000,
          labFee: 120000,
          prescriptionFee: 50000 // should be ignored
        }
      },
      user: { id: "6a132512a990feee8b4d5fc2" } // doctor
    } as unknown as Request;

    const res = {
      json: (data: any) => {
        console.log("Appointment update response status code:", res.statusCode || 200);
        return res;
      },
      status: (code: number) => {
        (res as any).statusCode = code;
        return res;
      }
    } as unknown as Response;

    console.log("\n--- Completing Appointment ---");
    await updateAppointmentStatus(req, res);

    // Verify invoices
    const activeInvoices = await Invoice.find({ patientId, status: "pending_payment" }).lean();
    console.log(`Created ${activeInvoices.length} active invoices:`);
    for (const inv of activeInvoices) {
      console.log(`- Invoice ID: ${inv._id}, Amount: ${inv.totalAmount} VNĐ`);
      for (const item of inv.items) {
        console.log(`  * ${item.description}: ${item.totalPrice} VNĐ`);
      }
    }

    // 5. Simulate Prescription Dispensing
    // Find/Create a medicine
    let med = await Medicine.findOne();
    if (!med) {
      med = new Medicine({
        name: "Paracetamol 500mg",
        price: 2000,
        stock: 100,
        unit: "vỉ",
        description: "Hạ sốt giảm đau"
      });
      await med.save();
    } else {
      med.price = 2000;
      med.stock = 100;
      await med.save();
    }
    console.log("\nMock medicine prepared ID:", med._id, "Price:", med.price);

    // Create a pending prescription
    const prescription = new Prescription({
      patientId,
      doctorId: "6a132512a990feee8b4d5fc2",
      diagnosis: "Sốt siêu vi",
      status: "pending",
      items: [
        {
          medicineId: med._id,
          medicineName: med.name,
          dosage: "1 viên",
          frequency: "3 lần/ngày",
          duration: "3 ngày",
          quantity: 10
        }
      ]
    });
    await prescription.save();
    console.log("Mock prescription created ID:", prescription._id);

    // Call confirmDispense
    const dispenseReq = {
      body: { prescriptionId: prescription._id.toString() },
      user: { id: "6a132512a990feee8b4d5fc5" } // pharmacist
    } as unknown as Request;

    const dispenseRes = {
      json: (data: any) => {
        console.log("Dispense response:", data);
        return dispenseRes;
      },
      status: (code: number) => {
        (dispenseRes as any).statusCode = code;
        return dispenseRes;
      }
    } as unknown as Response;

    console.log("\n--- Confirming Dispense ---");
    await confirmDispense(dispenseReq, dispenseRes);

    // Verify all active invoices again
    const allActiveInvoices = await Invoice.find({ patientId, status: "pending_payment" }).lean();
    console.log(`\nAfter dispense, total active invoices: ${allActiveInvoices.length}`);
    for (const inv of allActiveInvoices) {
      console.log(`- Invoice ID: ${inv._id}, Amount: ${inv.totalAmount} VNĐ`);
      for (const item of inv.items) {
        console.log(`  * ${item.description}: ${item.totalPrice} VNĐ`);
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Error in test script:", err);
    process.exit(1);
  }
}
run();
