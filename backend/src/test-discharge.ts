import mongoose from "mongoose";
import { dischargePatientFromBed, admitPatientToBed } from "./controllers/bed";
import Invoice from "./models/invoice";
import type { Request, Response } from "express";

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chems2chet_db_user:apperttk@cluster0.zcccoyn.mongodb.net/<db>?appName=OOP";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully!");

    const patientId = "6a13289da990feee8b4d5fc8"; // bn1
    const originalBedId = "6a148c3d093e5d3d52b0676f"; // Bed VIP/Normal that they were in

    const req = {
      params: { patientId },
      user: { id: "test-admin" }
    } as unknown as Request;

    let responseData: any = null;
    let statusCode: number = 200;

    const res = {
      json: (data: any) => {
        responseData = data;
        return res;
      },
      status: (code: number) => {
        statusCode = code;
        return res;
      }
    } as unknown as Response;

    // Remove any existing unpaid invoices for bn1 to start clean
    await Invoice.deleteMany({ patientId, status: { $in: ["draft", "pending_payment"] } });

    console.log("Discharging patient...");
    await dischargePatientFromBed(req, res);
    console.log("Discharge status:", statusCode, "Response:", responseData);

    // Verify invoice saved in DB
    const finalInvoice = await Invoice.findOne({ patientId, status: "pending_payment" }).sort({ createdAt: -1 });
    console.log("\nSaved Invoice in Database:");
    console.log(JSON.stringify(finalInvoice, null, 2));

    // Cleanup: Admit patient back to original bed
    console.log("\nCleaning up: Admitting patient back to original bed...");
    const admitReq = {
      body: {
        patientId,
        bedId: originalBedId,
        admissionReason: "ngu"
      },
      user: { id: "test-admin" }
    } as unknown as Request;

    await admitPatientToBed(admitReq, res);
    console.log("Cleanup admission done!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Error running test:", err);
    process.exit(1);
  }
}
run();
