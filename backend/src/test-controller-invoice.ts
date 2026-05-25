import mongoose from "mongoose";
import { getMyActiveInvoice } from "./controllers/invoice";
import type { Request, Response } from "express";

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chems2chet_db_user:apperttk@cluster0.zcccoyn.mongodb.net/<db>?appName=OOP";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully!");

    const req = {
      params: {
        patientId: "6a13289da990feee8b4d5fc8" // Patient bn1
      }
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

    await getMyActiveInvoice(req, res);

    console.log("Status:", statusCode);
    console.log("Active Invoice Result:");
    console.log(JSON.stringify(responseData, null, 2));

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Error running test:", err);
    process.exit(1);
  }
}
run();
