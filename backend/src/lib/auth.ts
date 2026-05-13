import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error("MONGO_URI is not defined in environment variables");
}

const client = new MongoClient(mongoUri);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5001",
  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:5173"],
  emailAndPassword: { enabled: true },
  plugins: [
    admin({
      defaultRole: "patient",
      adminRole: ["admin", "superadmin"],
    }),
  ],
  user: {
    additionalFields: {
      specialization: {
        type: "string",
        required: false,
      },
      department: {
        type: "string",
        required: false,
      },
      gender: {
        type: "string",
        required: false,
      },
      bloodgroup: {
        type: "string",
        required: false,
      },
      medicalHistory: {
        type: "string",
        required: false,
      },
      age: {
        type: "string",
        required: false,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "active",
      },
      prescriptions: {
        type: "string[]",
        required: false,
      },
      appointments: {
        type: "string[]",
      },
      experience: {
        type: "string",
        required: false,
      },
      consultationFee: {
        type: "number",
        required: false,
      },
      rating: {
        type: "number",
        required: false,
        defaultValue: 0,
      },
      isOnline: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      membership: {
        type: "string", // "standard" | "pro"
        required: false,
        defaultValue: "standard",
      },
      assignedBedId: {
        type: "string",
        required: false,
      },
      phoneNumber: {
        type: "string",
        required: false,
      },
      address: {
        type: "string",
        required: false,
      },
      birthday: {
        type: "string",
        required: false,
      },
      insuranceId: {
        type: "string",
        required: false,
      },
      patientType: {
        type: "string", // "inpatient" (nội trú) | "outpatient" (ngoại trú)
        required: false,
        defaultValue: "outpatient",
      },
    },
  },
});
