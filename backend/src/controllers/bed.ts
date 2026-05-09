import type { Request, Response } from "express";
import Bed from "../models/bed";
import mongoose from "mongoose";
import { logActivity } from "../lib/activity";

export const getAllBeds = async (req: Request, res: Response) => {
  try {
    const { department, type, status } = req.query;
    const filter: any = {};

    if (department) filter.department = department;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const beds = await Bed.find(filter).sort({ bedNumber: 1 });
    res.json(beds);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách giường bệnh" });
  }
};

export const createBed = async (req: Request, res: Response) => {
  try {
    const bedData = req.body;
    const newBed = new Bed(bedData);
    await newBed.save();
    res.status(201).json(newBed);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo giường bệnh" });
  }
};

export const updateBedStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, patientId } = req.body;

    const bed = await Bed.findById(id);
    if (!bed) return res.status(404).json({ message: "Không tìm thấy giường bệnh" });

    bed.status = status;
    bed.patientId = patientId || null;
    await bed.save();

    res.json(bed);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái giường" });
  }
};

export const admitPatientToBed = async (req: Request, res: Response) => {
  try {
    const { patientId, bedId, admissionReason } = req.body;

    // 1. Check if patient already has a bed
    const oldBed = await Bed.findOne({ patientId });
    if (oldBed) {
      oldBed.status = "available";
      oldBed.patientId = undefined;
      await oldBed.save();
    }

    // 2. Update New Bed
    const bed = await Bed.findById(bedId);
    if (!bed) return res.status(404).json({ message: "Không tìm thấy giường" });
    if (bed.status !== "available") return res.status(400).json({ message: "Giường này không còn trống" });

    bed.status = "occupied";
    bed.patientId = patientId;
    await bed.save();

    // 3. Update User (Inpatient status and Bed ID)
    const userCollection = mongoose.connection.collection("user");
    const queryId = patientId.length === 24 ? new mongoose.Types.ObjectId(patientId) : patientId;

    await userCollection.updateOne(
      { _id: queryId as any },
      { 
        $set: { 
          status: "admitted",
          patientType: "inpatient",
          assignedBedId: bedId,
          admissionReason: admissionReason
        } 
      }
    );

    await logActivity(
      (req as any).user.id,
      "Cho bệnh nhân nhập viện",
      `Bệnh nhân ${patientId} đã được gán vào giường ${bed.bedNumber}`
    );

    res.json({ message: "Nhập viện thành công", bed });
  } catch (error) {
    console.error("Error in admitPatientToBed:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi nhập viện" });
  }
};

export const dischargePatientFromBed = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    // 1. Find the bed occupied by this patient
    const bed = await Bed.findOne({ patientId });
    if (bed) {
      bed.status = "available";
      bed.patientId = undefined;
      await bed.save();
    }

    // 2. Update User status
    const userCollection = mongoose.connection.collection("user");
    const queryId = patientId.length === 24 ? new mongoose.Types.ObjectId(patientId) : patientId;

    await userCollection.updateOne(
      { _id: queryId as any },
      { 
        $set: { 
          status: "discharged",
          patientType: "outpatient",
          assignedBedId: null
        } 
      }
    );

    await logActivity(
      (req as any).user.id,
      "Cho bệnh nhân xuất viện",
      `Bệnh nhân ${patientId} đã xuất viện và trả giường`
    );

    res.json({ message: "Xuất viện thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống khi xuất viện" });
  }
};
