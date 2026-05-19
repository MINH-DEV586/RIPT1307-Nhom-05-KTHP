import type { Request, Response } from "express";
import MedicalRecord from "../models/medicalRecord";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import mongoose from "mongoose";

// Helper: lookup user từ Better Auth "user" collection
const lookupUser = async (userId: string, projection = { name: 1, specialization: 1, image: 1 }) => {
  try {
    const userCollection = mongoose.connection.collection("user");
    return await userCollection.findOne({ _id: userId as any }, { projection });
  } catch {
    return null;
  }
};

// @desc    Tạo hồ sơ bệnh án mới
// @route   POST /api/medical-records
// @access  Private (Doctor/Admin)
export const createMedicalRecord = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      patient,
      symptoms,
      diagnosis,
      treatmentPlan,
      notes,
      attachments,
      admissionReason,
      recordType,
      prescriptionId,       // ID đơn thuốc liên kết
    } = req.body;

    const newRecord = new MedicalRecord({
      patient,
      doctor: session.user.id,
      symptoms,
      diagnosis,
      treatmentPlan,
      notes,
      attachments,
      admissionReason,
      recordType: recordType || "inpatient",
      prescriptionId,       // Lưu vào DB
    });


    const savedRecord = await newRecord.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Lấy danh sách hồ sơ bệnh án của bệnh nhân
// @route   GET /api/medical-records/patient/:patientId
// @access  Private
export const getPatientMedicalRecords = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const records = await MedicalRecord.find({ patient: patientId })
      .sort({ date: -1 })
      .lean();

    const enriched = await Promise.all(
      records.map(async (record) => {
        const doctor = await lookupUser(record.doctor as string, {
          name: 1,
          specialization: 1,
          image: 1,
        });
        return {
          ...record,
          // Luôn trả về object, không bao giờ null
          doctor: doctor ?? { _id: record.doctor, name: "Bác sĩ hệ thống", specialization: "" },
        };
      })
    );


    res.status(200).json(enriched);
  } catch (error) {
    console.error("Error fetching medical records:", error);
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Lấy chi tiết một hồ sơ bệnh án
// @route   GET /api/medical-records/:id
// @access  Private
export const getMedicalRecordById = async (req: Request, res: Response) => {
  try {
    const record = await MedicalRecord.findById(req.params.id).lean();

    if (!record) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh án" });
    }

    const [patient, doctor] = await Promise.all([
      lookupUser(record.patient as string, { name: 1, gender: 1, age: 1, bloodgroup: 1 }),
      lookupUser(record.doctor as string, { name: 1, specialization: 1, department: 1 }),
    ]);

    res.status(200).json({ ...record, patient, doctor });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Cập nhật hồ sơ bệnh án
// @route   PUT /api/medical-records/:id
// @access  Private (Doctor/Admin only)
export const updateMedicalRecord = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const allowedRoles = ["admin", "doctor"];
    const userRole = (session.user as any).role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Chỉ bác sĩ hoặc admin mới được sửa hồ sơ" });
    }

    const { symptoms, diagnosis, treatmentPlan, notes, admissionReason } = req.body;

    const updated = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { symptoms, diagnosis, treatmentPlan, notes, admissionReason },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh án" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Xóa hồ sơ bệnh án
// @route   DELETE /api/medical-records/:id
// @access  Private (Doctor/Admin only)
export const deleteMedicalRecord = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const allowedRoles = ["admin", "doctor"];
    const userRole = (session.user as any).role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Chỉ bác sĩ hoặc admin mới được xóa hồ sơ" });
    }

    const deleted = await MedicalRecord.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh án" });
    }

    res.status(200).json({ message: "Đã xóa hồ sơ bệnh án thành công" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
