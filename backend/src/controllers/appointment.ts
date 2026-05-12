import type { Request, Response } from "express";
import Appointment from "../models/appointment";
import DoctorSchedule from "../models/doctorSchedule";
import mongoose from "mongoose";
import { logActivity } from "../lib/activity";
import { format, parseISO } from "date-fns";

// --- PATIENT ACTIONS ---

// Lấy danh sách bác sĩ kèm filter
export const getDoctors = async (req: Request, res: Response) => {
  try {
    const { specialization, date, type, feeMax } = req.query;
    const userCollection = mongoose.connection.collection("user");
    
    const filter: any = { role: "doctor" };
    if (specialization && specialization !== "all" && specialization !== "undefined") {
      filter.specialization = specialization;
    }
    if (feeMax) filter.consultationFee = { $lte: Number(feeMax) };

    const doctors = await userCollection.find(filter).toArray();
    
    // Bổ sung thông tin schedule cho từng bác sĩ
    const detailedDoctors = await Promise.all(doctors.map(async (doc) => {
      const schedule = await DoctorSchedule.findOne({ doctorId: doc._id.toString() });
      return { ...doc, schedule };
    }));

    res.json(detailedDoctors);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách bác sĩ" });
  }
};

// Đặt lịch khám
export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).user.id;
    const { doctorId, patientType, patientName, date, timeSlot, type, symptoms, notes, files } = req.body;

    const appointment = new Appointment({
      patientId,
      doctorId,
      patientType,
      patientName,
      date,
      timeSlot,
      type,
      symptoms,
      notes,
      files,
      status: "pending"
    });

    await appointment.save();
    await logActivity(patientId, "Đặt lịch khám", `Đặt lịch khám ${type} với bác sĩ ID: ${doctorId}`);

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi đặt lịch khám" });
  }
};

// Lấy danh sách lịch khám của tôi (Patient)
export const getMyAppointments = async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).user.id;
    const { status } = req.query;
    
    const filter: any = { patientId };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter).sort({ date: 1, timeSlot: 1 }).lean();
    
    const userCollection = mongoose.connection.collection("user");
    const detailed = await Promise.all(appointments.map(async (app) => {
      // Tìm kiếm bác sĩ
      let doctor = await userCollection.findOne({ _id: app.doctorId as any });
      if (!doctor && mongoose.Types.ObjectId.isValid(app.doctorId)) {
        doctor = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(app.doctorId) });
      }

      // Tìm kiếm bệnh nhân (nếu cần)
      let patient = await userCollection.findOne({ _id: app.patientId as any });
      if (!patient && mongoose.Types.ObjectId.isValid(app.patientId)) {
        patient = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(app.patientId) });
      }

      return { ...app, doctor, patient };
    }));

    res.json(detailed);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy lịch sử khám" });
  }
};

// --- DOCTOR ACTIONS ---

// Lấy danh sách lịch khám của bác sĩ
export const getDoctorAppointments = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, date, doctorId: queryDoctorId } = req.query;

    const filter: any = {};
    
    // Nếu là bác sĩ, chỉ cho phép xem lịch của chính mình
    // Nếu là admin, có thể xem tất cả hoặc xem theo doctorId cụ thể nếu truyền vào
    if (user.role === "doctor") {
      filter.doctorId = user.id;
    } else if (user.role === "admin") {
      if (queryDoctorId) {
        filter.doctorId = queryDoctorId;
      }
    } else {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    if (status) filter.status = status;
    if (date) {
      const start = new Date(date as string);
      start.setHours(0,0,0,0);
      const end = new Date(date as string);
      end.setHours(23,59,59,999);
      filter.date = { $gte: start, $lte: end };
    }

    const appointments = await Appointment.find(filter).sort({ date: 1, timeSlot: 1 }).lean();
    
    const userCollection = mongoose.connection.collection("user");
    const detailed = await Promise.all(appointments.map(async (app) => {
      // Tìm kiếm bệnh nhân
      let patient = await userCollection.findOne({ _id: app.patientId as any });
      if (!patient && mongoose.Types.ObjectId.isValid(app.patientId)) {
        patient = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(app.patientId) });
      }

      // Tìm kiếm bác sĩ
      let doctor = await userCollection.findOne({ _id: app.doctorId as any });
      if (!doctor && mongoose.Types.ObjectId.isValid(app.doctorId)) {
        doctor = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(app.doctorId) });
      }

      return { ...app, patient, doctor };
    }));

    res.json(detailed);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách lịch hẹn" });
  }
};

import Invoice from "../models/invoice";

// Cập nhật trạng thái (Accept/Reject/Complete)
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, meetingLink, billing, rejectionReason } = req.body;
    const userId = (req as any).user.id;

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });

    const oldStatus = appointment.status;
    appointment.status = status;
    if (meetingLink) appointment.meetingLink = meetingLink;
    if (rejectionReason) appointment.rejectionReason = rejectionReason;
    
    await appointment.save();

    // Nếu vừa chuyển sang trạng thái hoàn thành, tạo hóa đơn
    if (status === "completed" && oldStatus !== "completed") {
      const userCollection = mongoose.connection.collection("user");
      const doctor = await userCollection.findOne({ _id: appointment.doctorId as any });
      
      const items = [];
      let totalAmount = 0;

      // 1. Phí khám
      const consultationFee = billing?.consultationFee || doctor?.consultationFee || 200000;
      items.push({
        description: `Phí khám bệnh - ${doctor?.name || "Bác sĩ"}`,
        quantity: 1,
        unitPrice: consultationFee,
        totalPrice: consultationFee
      });
      totalAmount += consultationFee;

      // 2. Phí xét nghiệm (nếu có)
      if (billing?.labFee && billing.labFee > 0) {
        items.push({
          description: "Chi phí xét nghiệm & Cận lâm sàng",
          quantity: 1,
          unitPrice: billing.labFee,
          totalPrice: billing.labFee
        });
        totalAmount += billing.labFee;
      }

      // 3. Phí thuốc (nếu có)
      if (billing?.prescriptionFee && billing.prescriptionFee > 0) {
        items.push({
          description: "Chi phí đơn thuốc",
          quantity: 1,
          unitPrice: billing.prescriptionFee,
          totalPrice: billing.prescriptionFee
        });
        totalAmount += billing.prescriptionFee;
      }

      const newInvoice = new Invoice({
        patientId: appointment.patientId,
        status: "pending_payment",
        items,
        totalAmount
      });

      await newInvoice.save();
      await logActivity(userId, "Tạo hóa đơn chi tiết", `Đã tạo hóa đơn tổng cộng ${totalAmount} cho bệnh nhân ID: ${appointment.patientId}`);
    }
    
    await logActivity(userId, "Cập nhật trạng thái lịch hẹn", `Cập nhật lịch hẹn ${id} sang ${status}`);

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái" });
  }
};

// --- SCHEDULE ACTIONS ---

export const upsertSchedule = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user.id;
    const scheduleData = req.body;

    const schedule = await DoctorSchedule.findOneAndUpdate(
      { doctorId },
      { ...scheduleData, doctorId },
      { upsert: true, new: true }
    );

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật lịch làm việc" });
  }
};

export const getDoctorSchedule = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const schedule = await DoctorSchedule.findOne({ doctorId });
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy lịch làm việc" });
  }
};

// Lấy tất cả lịch làm việc (Admin)
export const getAllSchedules = async (req: Request, res: Response) => {
  try {
    const schedules = await DoctorSchedule.find().lean();
    
    // Bổ sung thông tin bác sĩ từ collection user
    const userCollection = mongoose.connection.collection("user");
    const detailed = await Promise.all(schedules.map(async (s) => {
      // Tìm kiếm bằng cả string ID và ObjectId để đảm bảo không sót
      let doctor = await userCollection.findOne({ _id: s.doctorId as any });
      
      if (!doctor && mongoose.Types.ObjectId.isValid(s.doctorId)) {
        doctor = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(s.doctorId) });
      }

      return { ...s, doctor };
    }));

    res.json(detailed);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách lịch làm việc" });
  }
};

// Tính toán khung giờ còn trống cho bệnh nhân
export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // Định dạng YYYY-MM-DD

    if (!date) return res.status(400).json({ message: "Thiếu thông tin ngày khám" });

    const schedule = await DoctorSchedule.findOne({ doctorId });
    if (!schedule) return res.status(404).json({ message: "Bác sĩ chưa thiết lập lịch làm việc" });

    // Sử dụng parseISO để tránh lỗi múi giờ
    const dateObj = parseISO(date as string);
    const dayOfWeek = format(dateObj, "EEEE"); // e.g., "Monday"
    
    if (!schedule.workingDays.includes(dayOfWeek)) {
      return res.json({ available: false, message: "Bác sĩ không làm việc vào ngày này", slots: [] });
    }

    // 2. Tạo tất cả các slot dựa trên workingHours và slotDuration
    const slots: string[] = [];
    let current = parseTime(schedule.workingHours.start);
    const end = parseTime(schedule.workingHours.end);
    const breakStart = parseTime(schedule.breakTime.start);
    const breakEnd = parseTime(schedule.breakTime.end);

    while (current < end) {
      const slotStart = formatTime(current);
      const next = new Date(current.getTime() + schedule.slotDuration * 60000);
      const slotEnd = formatTime(next);
      const slotLabel = `${slotStart} - ${slotEnd}`;

      // Loại bỏ slot nếu nằm trong giờ nghỉ
      const isBreak = current >= breakStart && current < breakEnd;
      
      if (!isBreak && next <= end) {
        slots.push(slotLabel);
      }
      current = next;
    }

    // 3. Loại bỏ các slot đã được đặt
    const startOfDay = new Date(date as string);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(date as string);
    endOfDay.setHours(23,59,59,999);

    const bookedAppointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "cancelled" }
    }).select("timeSlot");

    const bookedSlots = bookedAppointments.map(a => a.timeSlot);
    const availableSlots = slots.filter(s => !bookedSlots.includes(s));

    res.json({
      available: true,
      slots: availableSlots,
      workingHours: schedule.workingHours,
      breakTime: schedule.breakTime
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tính toán khung giờ trống" });
  }
};

// Helper functions for time parsing
function parseTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatTime(date: Date): string {
  return date.toTimeString().substring(0, 5);
}
