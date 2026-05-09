import type { Request, Response } from "express";
import Appointment from "../models/appointment";
import DoctorSchedule from "../models/doctorSchedule";
import mongoose from "mongoose";
import { logActivity } from "../lib/activity";

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
    
    // Bổ sung thông tin schedule nếu cần (ví dụ: filter theo ngày trống)
    // Để đơn giản, trả về danh sách bác sĩ trước
    res.json(doctors);
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
      const doctor = await userCollection.findOne(
        { _id: app.doctorId as any }, 
        { projection: { name: 1, specialization: 1, image: 1 } }
      );
      return { ...app, doctor };
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
    const doctorId = (req as any).user.id;
    const { status, date } = req.query;

    const filter: any = { doctorId };
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
      const patient = await userCollection.findOne(
        { _id: app.patientId as any }, 
        { projection: { name: 1, image: 1, gender: 1, age: 1 } }
      );
      return { ...app, patient };
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
    const { status, meetingLink, billing } = req.body;
    const userId = (req as any).user.id;

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });

    const oldStatus = appointment.status;
    appointment.status = status;
    if (meetingLink) appointment.meetingLink = meetingLink;
    
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
