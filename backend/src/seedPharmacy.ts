import mongoose from "mongoose";
import Medicine from "./models/medicine";
import Prescription from "./models/prescription";
import { connectDB } from "./config/db";
import * as dotenv from "dotenv";

dotenv.config();

async function seedPharmacy() {
  await connectDB();
  
  try {
    // 1. Create some medicines
    const medicines = [
      {
        name: "Paracetamol",
        category: "Painkiller",
        stock: 100,
        unit: "tablet",
        price: 500,
        expiryDate: new Date("2025-12-31")
      },
      {
        name: "Amoxicillin",
        category: "Antibiotic",
        stock: 50,
        unit: "capsule",
        price: 2000,
        expiryDate: new Date("2025-06-30")
      },
      {
        name: "Vitamin C",
        category: "Supplement",
        stock: 200,
        unit: "tablet",
        price: 1000,
        expiryDate: new Date("2026-01-01")
      }
    ];

    await Medicine.deleteMany({});
    const createdMedicines = await Medicine.insertMany(medicines);
    console.log("✅ Seeded medicines");

    // 2. Create a test prescription
    const userCollection = mongoose.connection.collection("user");
    
    let patient = await userCollection.findOne({ role: "patient" });
    if (!patient) {
      console.log("Creating dummy patient...");
      const newPatient = {
        name: "Test Patient",
        email: "patient@test.com",
        role: "patient",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const res = await userCollection.insertOne(newPatient);
      patient = await userCollection.findOne({ _id: res.insertedId });
    }

    let doctor = await userCollection.findOne({ role: "doctor" });
    if (!doctor) {
      console.log("Creating dummy doctor...");
      const newDoctor = {
        name: "Dr. Smith",
        email: "doctor@test.com",
        role: "doctor",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const res = await userCollection.insertOne(newDoctor);
      doctor = await userCollection.findOne({ _id: res.insertedId });
    }

    if (patient && doctor) {
      const prescription = {
        patientId: patient._id.toString(),
        doctorId: doctor._id.toString(),
        diagnosis: "Common Cold",
        status: "pending",
        items: [
          {
            medicineId: createdMedicines[0]._id,
            medicineName: createdMedicines[0].name,
            dosage: "500mg",
            frequency: "3 times a day",
            duration: "5 days",
            quantity: 15
          },
          {
            medicineId: createdMedicines[2]._id,
            medicineName: createdMedicines[2].name,
            dosage: "1000mg",
            frequency: "Once a day",
            duration: "10 days",
            quantity: 10
          }
        ]
      };

      await Prescription.deleteMany({});
      const createdPrescription = await Prescription.create(prescription);
      console.log("✅ Seeded a test prescription for patient:", patient.name);
      console.log("   Prescription ID:", createdPrescription._id);
    }

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    mongoose.connection.close();
  }
}

seedPharmacy();
