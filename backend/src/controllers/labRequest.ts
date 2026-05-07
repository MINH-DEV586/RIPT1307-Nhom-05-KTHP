import type { Request, Response } from "express";
import LabRequest from "../models/labRequest";
import { logActivity } from "../lib/activity";
import mongoose from "mongoose";

export const createLabRequest = async (req: Request, res: Response) => {
  try {
    const { patientId, testType, notes } = req.body;
    const doctorId = (req as any).user.id;

    if (!patientId || !testType) {
      return res.status(400).json({ message: "Thông tin bệnh nhân và loại xét nghiệm là bắt buộc" });
    }

    const newRequest = new LabRequest({
      patientId,
      doctorId,
      testType,
      notes,
    });

    await newRequest.save();

    await logActivity(
      doctorId,
      "Tạo yêu cầu xét nghiệm",
      `Đã tạo yêu cầu ${testType} cho bệnh nhân ID: ${patientId}`
    );

    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Error creating lab request:", error);
    res.status(500).json({ message: "Lỗi khi tạo yêu cầu xét nghiệm" });
  }
};

export const getLabRequests = async (req: Request, res: Response) => {
  try {
    const { patientId, status } = req.query;
    const filter: any = {};
    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;

    const requests = await LabRequest.find(filter).sort({ createdAt: -1 }).lean();
    
    const userCollection = mongoose.connection.collection("user");
    
    const detailedRequests = await Promise.all(
      requests.map(async (r) => {
        const patient = await userCollection.findOne(
          { _id: new mongoose.Types.ObjectId(r.patientId) },
          { projection: { name: 1 } }
        );
        const doctor = await userCollection.findOne(
          { _id: new mongoose.Types.ObjectId(r.doctorId) },
          { projection: { name: 1 } }
        );
        return { 
          ...r, 
          patientName: patient?.name || "N/A",
          doctorName: doctor?.name || "N/A"
        };
      })
    );

    res.json(detailedRequests);
  } catch (error) {
    console.error("Error fetching lab requests:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách yêu cầu" });
  }
};

export const updateLabRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedRequest = await LabRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedRequest) return res.status(404).json({ message: "Không tìm thấy yêu cầu" });

    res.json(updatedRequest);
  } catch (error) {
    console.error("Error updating lab request status:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái" });
  }
};

export const getLabRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = await LabRequest.findById(id).lean();
    if (!request) return res.status(404).json({ message: "Không tìm thấy yêu cầu" });

    const userCollection = mongoose.connection.collection("user");
    const patient = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(request.patientId) });
    const doctor = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(request.doctorId) });

    res.json({ ...request, patient, doctor });
  } catch (error) {
    console.error("Error fetching lab request by ID:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
