import type { Request, Response } from "express";
import ExamHistory from "../models/examHistory";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import mongoose from "mongoose";

// Helper: manual lookup user từ Better Auth "user" collection (string IDs)
const lookupUser = async (
  userId: string,
  projection = { name: 1, specialization: 1, image: 1 }
) => {
  try {
    const userCollection = mongoose.connection.collection("user");
    return await userCollection.findOne({ _id: userId as any }, { projection });
  } catch {
    return null;
  }
};

// @desc    Tạo lịch sử khám (ngoại trú)
// @route   POST /api/exam-history
// @access  Private (Doctor/Admin)
export const createExamHistory = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      patient,
      chiefComplaint,
      visitReason,
      symptoms,
      diagnosis,
      treatment,
      treatmentPlan,
      prescription,
      followUpDate,
      nextAppointment,
      notes,
      examDate,
    } = req.body;

    // Validate required fields
    if (!patient || !symptoms || !diagnosis || !(treatment || treatmentPlan)) {
      return res.status(400).json({
        message: "Thiếu thông tin bắt buộc: patient, symptoms, diagnosis, treatment",
      });
    }

    const record = new ExamHistory({
      patient,                                          // string ID
      doctor: session.user.id,                         // string ID từ session
      examDate: examDate || new Date(),
      chiefComplaint: chiefComplaint || visitReason || "Khám tổng quát",
      symptoms,
      diagnosis,
      treatment: treatment || treatmentPlan,
      prescription,
      followUpDate: followUpDate || nextAppointment,
      notes,
      visitType: "outpatient",
    });

    const saved = await record.save();

    // Manual lookup thay vì .populate() vì Better Auth không có Mongoose model "User"
    const [doctorInfo, patientInfo] = await Promise.all([
      lookupUser(saved.doctor as string, { name: 1, specialization: 1, department: 1, image: 1 }),
      lookupUser(saved.patient as string, { name: 1, gender: 1, bloodgroup: 1, image: 1 }),
    ]);

    res.status(201).json({
      ...saved.toObject(),
      doctor: doctorInfo || { _id: saved.doctor },
      patient: patientInfo || { _id: saved.patient },
    });
  } catch (error) {
    console.error("createExamHistory error:", error);
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Lấy lịch sử khám của một bệnh nhân
// @route   GET /api/exam-history/patient/:patientId
// @access  Private (tất cả roles)
export const getPatientExamHistory = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const records = await ExamHistory.find({ patient: patientId })
      .sort({ examDate: -1 })
      .lean();

    // Manual lookup doctor cho mỗi record
    const enriched = await Promise.all(
      records.map(async (record) => {
        const doctor = await lookupUser(record.doctor as string, {
          name: 1,
          specialization: 1,
          image: 1,
        });
        return { ...record, doctor: doctor || { _id: record.doctor } };
      })
    );

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Lấy chi tiết một kết quả khám
// @route   GET /api/exam-history/:id
// @access  Private
export const getExamHistoryById = async (req: Request, res: Response) => {
  try {
    const record = await ExamHistory.findById(req.params.id).lean();

    if (!record) {
      return res.status(404).json({ message: "Không tìm thấy kết quả khám" });
    }

    const [doctorInfo, patientInfo] = await Promise.all([
      lookupUser(record.doctor as string, { name: 1, specialization: 1, department: 1, image: 1 }),
      lookupUser(record.patient as string, { name: 1, gender: 1, bloodgroup: 1, image: 1 }),
    ]);

    res.status(200).json({
      ...record,
      doctor: doctorInfo || { _id: record.doctor },
      patient: patientInfo || { _id: record.patient },
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Lấy tất cả lịch sử khám (admin/doctor)
// @route   GET /api/exam-history
// @access  Private (Doctor/Admin)
export const getAllExamHistory = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const total = await ExamHistory.countDocuments();
    const records = await ExamHistory.find()
      .sort({ examDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const enriched = await Promise.all(
      records.map(async (record) => {
        const [doctorInfo, patientInfo] = await Promise.all([
          lookupUser(record.doctor as string, { name: 1, specialization: 1 }),
          lookupUser(record.patient as string, { name: 1, age: 1, gender: 1 }),
        ]);
        return {
          ...record,
          doctor: doctorInfo || { _id: record.doctor },
          patient: patientInfo || { _id: record.patient },
        };
      })
    );

    res.status(200).json({
      res: enriched,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalData: total,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
