import type { Request, Response } from "express";
import MedicalRecord from "../models/medicalRecord";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import mongoose from "mongoose";

// @desc    Create a new medical record
// @route   POST /api/medical-records
// @access  Private (Doctor/Nurse/Admin)
export const createMedicalRecord = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { patient, symptoms, diagnosis, treatmentPlan, notes, attachments } = req.body;

    // patient is a string ID (Better Auth format), store as-is
    const newRecord = new MedicalRecord({
      patient,          // string ID
      doctor: session.user.id, // string ID
      symptoms,
      diagnosis,
      treatmentPlan,
      notes,
      attachments,
    });

    const savedRecord = await newRecord.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Helper: lookup user from Better Auth "user" collection
const lookupUser = async (userId: string, projection = { name: 1, specialization: 1, image: 1 }) => {
  try {
    const userCollection = mongoose.connection.collection("user");
    // Better Auth IDs are strings; try as string _id first
    return await userCollection.findOne({ _id: userId as any }, { projection });
  } catch {
    return null;
  }
};

// @desc    Get all medical records for a specific patient
// @route   GET /api/medical-records/patient/:patientId
// @access  Private
export const getPatientMedicalRecords = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    // Query by string patientId (Better Auth format)
    const records = await MedicalRecord.find({ patient: patientId })
      .sort({ date: -1 })
      .lean();

    // Manual lookup for doctor info since Better Auth uses "user" collection with string IDs
    const enriched = await Promise.all(
      records.map(async (record) => {
        const doctor = await lookupUser(record.doctor as string, { name: 1, specialization: 1, image: 1 });
        return { ...record, doctor };
      })
    );

    res.status(200).json(enriched);
  } catch (error) {
    console.error("Error fetching medical records:", error);
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get a single medical record by ID
// @route   GET /api/medical-records/:id
// @access  Private
export const getMedicalRecordById = async (req: Request, res: Response) => {
  try {
    const record = await MedicalRecord.findById(req.params.id).lean();

    if (!record) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    // Manual lookup for patient and doctor
    const [patient, doctor] = await Promise.all([
      lookupUser(record.patient as string, { name: 1, gender: 1, age: 1, bloodgroup: 1 }),
      lookupUser(record.doctor as string, { name: 1, specialization: 1, department: 1 }),
    ]);

    res.status(200).json({ ...record, patient, doctor });
  } catch (error) {
    console.error("Error fetching medical record by ID:", error);
    res.status(500).json({ message: (error as Error).message });
  }
};

