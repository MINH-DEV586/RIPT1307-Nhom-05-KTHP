import type { Request, Response } from "express";
import ExamHistory from "../models/examHistory";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

// @desc    Create exam history record (outpatient)
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
      // Hỗ trợ cả 2 tên field (frontend cũ và mới)
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
      prescriptionIds,
      labRequestIds,
    } = req.body;

    const record = new ExamHistory({
      patient,
      doctor: session.user.id,
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
    const populated = await ExamHistory.findById(saved._id)
      .populate("doctor", "name specialization department image")
      .populate("patient", "name gender age bloodgroup image");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};


// @desc    Get all exam history for a patient
// @route   GET /api/exam-history/patient/:patientId
// @access  Private
export const getPatientExamHistory = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const records = await ExamHistory.find({ patient: patientId })
      .populate("doctor", "name specialization department image")
      .sort({ examDate: -1 });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get single exam history by ID
// @route   GET /api/exam-history/:id
// @access  Private
export const getExamHistoryById = async (req: Request, res: Response) => {
  try {
    const record = await ExamHistory.findById(req.params.id)
      .populate("patient", "name gender age bloodgroup image")
      .populate("doctor", "name specialization department image");

    if (!record) {
      return res.status(404).json({ message: "Không tìm thấy kết quả khám" });
    }

    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get all exam history (for admin/doctor view)
// @route   GET /api/exam-history
// @access  Private (Doctor/Admin)
export const getAllExamHistory = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const total = await ExamHistory.countDocuments();
    const records = await ExamHistory.find()
      .populate("doctor", "name specialization")
      .populate("patient", "name age gender")
      .sort({ examDate: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      res: records,
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
