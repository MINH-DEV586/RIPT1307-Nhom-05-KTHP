import type { Request, Response } from "express";
import { TelemedicineSession, Message } from "../models/telemedicine";
import { logActivity } from "../lib/activity";
import mongoose from "mongoose";

// Đặt lịch khám online
export const bookSession = async (req: Request, res: Response) => {
  try {
    const { doctorId, startTime, notes } = req.body;
    const patientId = (req as any).user.id;

    const session = new TelemedicineSession({
      patientId,
      doctorId,
      startTime,
      notes,
    });

    await session.save();

    await logActivity(patientId, "Đặt lịch khám từ xa", `Đặt lịch với bác sĩ ID: ${doctorId}`);

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi đặt lịch khám" });
  }
};

// Lấy danh sách phiên khám của người dùng (Bác sĩ hoặc Bệnh nhân)
export const getSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;

    const filter = role === "doctor" ? { doctorId: userId } : { patientId: userId };
    const sessions = await TelemedicineSession.find(filter).sort({ startTime: 1 }).lean();

    const userCollection = mongoose.connection.collection("user");

    const detailedSessions = await Promise.all(
      sessions.map(async (s) => {
        const otherId = role === "doctor" ? s.patientId : s.doctorId;
        let queryId: any = otherId;
        try {
          if (mongoose.Types.ObjectId.isValid(otherId)) {
            queryId = new mongoose.Types.ObjectId(otherId);
          }
        } catch (e) {
          // Keep as string if not valid ObjectId
        }

        const otherUser = await userCollection.findOne(
          { _id: queryId },
          { projection: { name: 1, image: 1 } }
        );
        return { ...s, otherUser };
      })
    );

    res.json(detailedSessions);
  } catch (error) {
    console.error("Error in getSessions:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách phiên khám" });
  }
};

// Lấy lịch sử chat của một phiên khám
export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const messages = await Message.find({ sessionId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy lịch sử chat" });
  }
};

// Cập nhật trạng thái phiên khám
export const updateSessionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await TelemedicineSession.findByIdAndUpdate(id, { status }, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái" });
  }
};
