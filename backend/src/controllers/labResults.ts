import labResults from "../models/labResults";
import LabRequest from "../models/labRequest";
import type { Request, Response } from "express";
import { logActivity } from "../lib/activity";
import { inngest } from "../inngest/client";

export const createLabResult = async (req: Request, res: Response) => {
  try {
    const { 
      patientId, 
      labRequestId, 
      testType, 
      bodyPart, 
      imageUrl, 
      aiAnalysis, 
      indicators, 
      note 
    } = req.body;
    const createdBy = (req as any).user.id;

    const newLabResult = new labResults({
      patient: patientId,
      labRequestId,
      uploadedBy: createdBy,
      testType,
      bodyPart,
      imageUrl,
      aiAnalysis,
      indicators,
      doctorNotes: note,
      status: indicators && indicators.length > 0 ? "completed" : "pending",
    });

    await newLabResult.save();

    // Update linked LabRequest status if exists
    if (labRequestId) {
      await LabRequest.findByIdAndUpdate(labRequestId, { status: "completed" });
    }

    // AI Analysis trigger for scans
    if (imageUrl) {
      await inngest.send({
        name: "labResult/created",
        data: {
          labResultId: newLabResult._id,
          imageUrl,
          bodyPart,
        },
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("lab_result_added");
    }

    await logActivity(
      createdBy,
      "Tạo kết quả xét nghiệm",
      `Đã tạo ${testType} cho bệnh nhân: ${patientId}`
    );

    res.status(201).json({
      message: "Đã tạo kết quả xét nghiệm thành công",
      labResult: newLabResult,
    });
  } catch (error) {
    console.error("Error creating lab result:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getAllLabResults = async (req: Request, res: Response) => {
  try {
    const results = await labResults.find().sort({ createdAt: -1 }).lean();
    const mongoose = (await import("mongoose")).default;
    const userCollection = mongoose.connection.collection("user");
    
    const detailedResults = await Promise.all(
      results.map(async (r) => {
        const patient = await userCollection.findOne(
          { _id: new mongoose.Types.ObjectId(r.patient) },
          { projection: { name: 1 } }
        );
        return { ...r, patientName: patient?.name || "N/A" };
      })
    );

    res.json(detailedResults);
  } catch (error) {
    console.error("Error fetching all results:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getPatientLabResults = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const results = await labResults
      .find({ patient: patientId })
      .sort({ createdAt: -1 });

    res.json(results);
  } catch (error) {
    console.error("Error fetching lab results:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateLabResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedResult = await labResults.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedResult) {
      return res.status(404).json({ message: "Không tìm thấy kết quả xét nghiệm" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("lab_result_updated");
    }

    await logActivity(
      (req as any).user.id,
      "Cập nhật kết quả xét nghiệm",
      `Đã cập nhật xét nghiệm ID: ${id}`,
    );

    res.json({
      message: "Đã cập nhật kết quả xét nghiệm thành công",
      labResult: updatedResult,
    });
  } catch (error) {
    console.error("Error updating lab result:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
