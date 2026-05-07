import type { Request, Response } from "express";
import MedicalRecord from "../models/medicalRecord";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

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

    const newRecord = new MedicalRecord({
      patient,
      doctor: session.user.id,
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

// @desc    Get all medical records for a specific patient
// @route   GET /api/medical-records/patient/:patientId
// @access  Private
export const getPatientMedicalRecords = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const records = await MedicalRecord.find({ patient: patientId })
      .populate("doctor", "name specialization")
      .sort({ date: -1 });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get a single medical record by ID
// @route   GET /api/medical-records/:id
// @access  Private
export const getMedicalRecordById = async (req: Request, res: Response) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate("patient", "name gender age bloodgroup")
      .populate("doctor", "name specialization department");

    if (!record) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
