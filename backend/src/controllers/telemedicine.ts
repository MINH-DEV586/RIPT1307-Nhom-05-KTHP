import type { Request, Response } from "express";
import { TelemedicineSession, Message } from "../models/telemedicine";
import Appointment from "../models/appointment";
import { logActivity } from "../lib/activity";
import mongoose from "mongoose";
import { sendMail } from "../lib/mailer";
import { getIO } from "../lib/socket";

// Đặt lịch khám online
export const bookSession = async (req: Request, res: Response) => {
  try {
    const { doctorId, startTime, notes } = req.body;
    const patientId = (req as any).user.id;

    // Kiểm tra xem đã có phiên khám nào giữa 2 người này chưa
    const existingSession = await TelemedicineSession.findOne({
      patientId,
      doctorId,
      status: { $in: ["scheduled", "active"] }
    });

    if (existingSession) {
      return res.status(200).json(existingSession);
    }

    const session = new TelemedicineSession({
      patientId,
      doctorId,
      startTime,
      notes,
    });

    await session.save();

    await logActivity(patientId, "Đặt lịch khám từ xa", `Đặt lịch với bác sĩ ID: ${doctorId}`);

    try {
      const userCollection = mongoose.connection.collection("user");
      let patientObj = await userCollection.findOne({ _id: patientId as any });
      if (!patientObj && mongoose.Types.ObjectId.isValid(patientId)) {
        patientObj = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(patientId) });
      }

      let doctorObj = await userCollection.findOne({ _id: doctorId as any });
      if (!doctorObj && mongoose.Types.ObjectId.isValid(doctorId)) {
        doctorObj = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(doctorId) });
      }

      if (patientObj && patientObj.email) {
        const formattedDate = new Date(startTime).toLocaleString('vi-VN');
        const htmlContent = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 5px solid #4f46e5;">
              <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Xác nhận lịch khám từ xa</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Xin chào <strong style="color: #111827;">${patientObj.name}</strong>,</p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Cảm ơn bạn đã tin tưởng dịch vụ của MedFlow. Lịch khám từ xa (Telemedicine) của bạn đã được ghi nhận thành công. Dưới đây là thông tin chi tiết:</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;"><strong>👨‍⚕️ Bác sĩ:</strong> ${doctorObj?.name || 'Bác sĩ chuyên khoa'}</p>
                <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;"><strong>⏰ Thời gian:</strong> ${formattedDate}</p>
                <p style="margin: 0; color: #374151; font-size: 15px;"><strong>📝 Ghi chú:</strong> ${notes || 'Không có'}</p>
              </div>

              <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Vui lòng đăng nhập vào hệ thống và chuẩn bị sẵn sàng trước <strong>5 phút</strong> để đảm bảo kết nối video call với bác sĩ diễn ra tốt nhất.</p>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/telemedicine" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Truy cập phòng khám</a>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              
              <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">Trân trọng,<br><strong>Đội ngũ MedFlow AI</strong></p>
            </div>
          </div>
        `;
        
        sendMail(patientObj.email, "Xác nhận lịch khám từ xa - Phòng Khám", htmlContent).catch(err => {
          console.error("Failed to send telemedicine booking email:", err);
        });
      }
    } catch (mailError) {
      console.error("Error preparing email for telemedicine:", mailError);
    }

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi đặt lịch khám" });
  }
};

// Lấy danh sách phiên khám của người dùng (Bác sĩ hoặc Bệnh nhân) hoặc tất cả (Admin)
export const getSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;

    // Admin xem tất cả sessions, doctor/patient chỉ xem sessions của mình
    let sessionFilter: any = {};
    let appointmentFilter: any = { status: "confirmed" };
    if (role === "doctor") {
      sessionFilter = { doctorId: userId };
      appointmentFilter = { doctorId: userId, status: "confirmed" };
    } else if (role === "patient") {
      sessionFilter = { patientId: userId };
      appointmentFilter = { patientId: userId, status: "confirmed" };
    }
    // admin: không filter -> lấy tất cả
    
    // 1. Fetch from TelemedicineSession
    const sessions = await TelemedicineSession.find(sessionFilter).sort({ startTime: 1 }).lean();
    
    // 2. Fetch from Appointment (Confirmed only)
    const appointments = await Appointment.find(appointmentFilter).lean();
    const mappedAppointments = appointments.map(a => ({
      ...a,
      startTime: a.date,
      notes: a.symptoms,
      isAppointment: true
    }));

    // Combine both
    const combined = [...sessions, ...mappedAppointments];

    const userCollection = mongoose.connection.collection("user");

    const detailedSessions = await Promise.all(
      combined.map(async (s: any) => {
        // Với admin, lấy thông tin cả 2 phía (doctor + patient)
        if (role === "admin") {
          const lookupId = (id: string) => {
            try {
              if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
            } catch (e) {}
            return id as any;
          };
          const [doctorUser, patientUser] = await Promise.all([
            userCollection.findOne({ _id: lookupId(s.doctorId) }, { projection: { name: 1, image: 1, specialization: 1 } }),
            userCollection.findOne({ _id: lookupId(s.patientId) }, { projection: { name: 1, image: 1, specialization: 1 } }),
          ]);
          const lastMsg = await Message.findOne({ sessionId: s._id }).sort({ createdAt: -1 });
          return {
            ...s,
            otherUser: patientUser, // Hiển thị bệnh nhân trong sidebar
            doctorUser,
            patientUser,
            lastMessage: lastMsg?.content || s.notes,
            updatedAt: lastMsg?.createdAt || s.updatedAt || s.startTime
          };
        }

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
          { projection: { name: 1, image: 1, specialization: 1 } }
        );

        // Fetch last message
        const lastMsg = await Message.findOne({ sessionId: s._id }).sort({ createdAt: -1 });

        return { 
          ...s, 
          otherUser, 
          lastMessage: lastMsg?.content || s.notes,
          updatedAt: lastMsg?.createdAt || s.updatedAt || s.startTime
        };
      })
    );

    // Sort by latest activity
    detailedSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

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
// Xóa cuộc hội thoại
export const deleteSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Thử tìm trong TelemedicineSession trước
    let session: any = await TelemedicineSession.findById(id);
    let isAppointmentSession = false;

    if (!session) {
      // Nếu không tìm thấy, thử tìm trong Appointment (chỉ admin mới được xóa loại này)
      if (userRole !== "admin") {
        return res.status(404).json({ message: "Không tìm thấy phiên khám" });
      }
      session = await Appointment.findById(id);
      if (!session) {
        return res.status(404).json({ message: "Không tìm thấy phiên khám" });
      }
      isAppointmentSession = true;
    }

    // Admin được phép xóa bất kỳ phiên khám nào
    // Bác sĩ hoặc bệnh nhân chỉ được xóa phiên khám của mình
    if (userRole !== "admin" && session.patientId !== userId && session.doctorId !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xóa phiên khám này" });
    }

    if (isAppointmentSession) {
      // Xóa Appointment và toàn bộ tin nhắn liên quan
      await Appointment.findByIdAndDelete(id);
      await Message.deleteMany({ sessionId: id });
    } else {
      await TelemedicineSession.findByIdAndDelete(id);
      await Message.deleteMany({ sessionId: id });
    }

    // Thông báo cho bên còn lại qua socket
    try {
      const io = getIO();
      io.to(id).emit("session_deleted", id);
    } catch (err) {
      console.error("Socket emit failed in deleteSession:", err);
    }

    await logActivity(userId, "Xóa cuộc hội thoại", `Đã xóa phiên khám ID: ${id}`);

    res.json({ message: "Đã xóa cuộc hội thoại thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa phiên khám" });
  }
};

