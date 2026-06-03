import type { Request, Response } from "express";
import Appointment from "../models/appointment";
import DoctorSchedule from "../models/doctorSchedule";
import mongoose from "mongoose";
import { logActivity } from "../lib/activity";
import { format, parseISO } from "date-fns";
import { sendMail, getAppointmentConfirmedTemplate, getAppointmentRejectedTemplate } from "../lib/mailer";
import Notification from "../models/notification";
import { getIO } from "../lib/socket";
import Invoice from "../models/invoice";

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

    // Parse and validate date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Ngày hẹn không hợp lệ" });
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dateStr = date.split('T')[0];
    if (dateStr < todayStr) {
      return res.status(400).json({ message: "Không thể đặt lịch hẹn trong quá khứ" });
    }

    const appointment = new Appointment({
      patientId,
      doctorId,
      patientType,
      patientName,
      date: parsedDate,
      timeSlot,
      type,
      symptoms,
      notes,
      files,
      status: "pending"
    });

    await appointment.save();
    await logActivity(patientId, "Đặt lịch khám", `Đặt lịch khám ${type} với bác sĩ ID: ${doctorId}`);

    // Tạo thông báo cho bác sĩ khi có bệnh nhân đặt lịch
    try {
      await Notification.create({
        user: doctorId,
        title: "Bệnh nhân đặt lịch hẹn",
        message: `Bệnh nhân ${patientName || 'một bệnh nhân'} đã đặt lịch vào ${format(new Date(date), 'dd/MM/yyyy')} (${timeSlot})`,
        type: "system",
        link: `/appointments/${appointment._id}`,
      });
      try {
        getIO().emit(`new_notification_${doctorId}`);
      } catch (e) {
        // ignore socket errors
      }
    } catch (notifyErr) {
      console.error("Failed to create notification for doctor on booking:", notifyErr);
    }

    // Không gửi email khi đặt lịch (trạng thái pending), chỉ gửi khi bác sĩ duyệt hoặc từ chối

    res.status(201).json(appointment);
  } catch (error: any) {
    console.error("Booking error:", error);
    res.status(500).json({ message: "Lỗi khi đặt lịch khám", error: error.message || error });
  }
};

// Lấy danh sách lịch khám của tôi (Patient)
export const getMyAppointments = async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).user.id;
    const { status, includeAll } = req.query;
    
    const filter: any = { patientId };
    if (status) filter.status = status;
    
    // By default, show upcoming appointments only (future dates)
    // Don't filter by date on backend - let frontend handle it for flexibility
    // This ensures all appointments are returned regardless of date
    
    const appointments = await Appointment.find(filter).sort({ date: 1, timeSlot: 1 }).lean();
    console.log(`[getMyAppointments] PatientID: ${patientId}, Found: ${appointments.length} appointments`);
    
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

// Lấy chi tiết lịch hẹn theo ID
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const appointment = await Appointment.findById(id).lean();
    if (!appointment) return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });

    if (user.role === "doctor" && appointment.doctorId !== user.id) {
      return res.status(403).json({ message: "Không có quyền truy cập lịch hẹn này" });
    }
    if (user.role === "patient" && appointment.patientId !== user.id) {
      return res.status(403).json({ message: "Không có quyền truy cập lịch hẹn này" });
    }

    const userCollection = mongoose.connection.collection("user");
    let doctor = await userCollection.findOne({ _id: appointment.doctorId as any });
    if (!doctor && mongoose.Types.ObjectId.isValid(appointment.doctorId)) {
      doctor = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(appointment.doctorId) });
    }

    let patient = await userCollection.findOne({ _id: appointment.patientId as any });
    if (!patient && mongoose.Types.ObjectId.isValid(appointment.patientId)) {
      patient = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(appointment.patientId) });
    }

    res.json({ ...appointment, doctor, patient });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy chi tiết lịch hẹn" });
  }
};

// --- DOCTOR ACTIONS ---

// Lấy danh sách lịch khám của bác sĩ
export const getDoctorAppointments = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, date, doctorId: queryDoctorId, includeAll } = req.query;

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
    
    // Only filter by specific date if provided, don't filter by "upcoming" on backend
    if (date) {
      const start = new Date(date as string);
      start.setHours(0,0,0,0);
      const end = new Date(date as string);
      end.setHours(23,59,59,999);
      filter.date = { $gte: start, $lte: end };
    }

    const appointments = await Appointment.find(filter).sort({ date: 1, timeSlot: 1 }).lean();
    
    // Bổ sung thông tin bệnh nhân và bác sĩ
    const userCollection = mongoose.connection.collection("user");
    const detailed = await Promise.all(appointments.map(async (app) => {
      let patient = await userCollection.findOne({ _id: app.patientId as any });
      if (!patient && mongoose.Types.ObjectId.isValid(app.patientId)) {
        patient = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(app.patientId) });
      }
      
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

    // Cập nhật trạng thái lịch hẹn (ví dụ: bác sĩ xác nhận)
    export const updateAppointmentStatus = async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { status, billing, rejectionReason } = req.body;
        const userId = (req as any).user.id;

        const appointment = await Appointment.findByIdAndUpdate(id, { status, rejectionReason }, { new: true }).lean();
        if (!appointment) return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });

        const userCollection = mongoose.connection.collection("user");

        // Nếu bác sĩ xác nhận lịch, thông báo và gửi email cho bệnh nhân
        if (status === "confirmed") {
          try {
            let doctorObj = await userCollection.findOne({ _id: appointment.doctorId as any });
            if (!doctorObj && mongoose.Types.ObjectId.isValid(appointment.doctorId)) {
              doctorObj = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(appointment.doctorId) });
            }

            let patientObj = await userCollection.findOne({ _id: appointment.patientId as any });
            if (!patientObj && mongoose.Types.ObjectId.isValid(appointment.patientId)) {
              patientObj = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(appointment.patientId) });
            }

            await Notification.create({
              user: appointment.patientId,
              title: "Bác sĩ xác nhận lịch hẹn",
              message: `Bác sĩ ${doctorObj?.name || 'Bác sĩ'} đã xác nhận lịch hẹn của bạn vào ${format(new Date(appointment.date), 'dd/MM/yyyy')} (${appointment.timeSlot})`,
              type: "system",
              link: `/appointments/${id}`,
            });
            try { getIO().emit(`new_notification_${appointment.patientId}`); } catch (e) { /* ignore */ }

            // Gửi email xác nhận đến bệnh nhân
            if (patientObj && patientObj.email) {
              const emailHtml = getAppointmentConfirmedTemplate(
                patientObj.name || appointment.patientName || "Bệnh nhân",
                doctorObj?.name || "Bác sĩ",
                appointment.date,
                appointment.timeSlot,
                appointment.type,
                appointment.symptoms
              );
              
              sendMail(
                patientObj.email,
                "✓ Lịch hẹn khám của bạn đã được duyệt",
                emailHtml
              ).catch(err => {
                console.error("Failed to send appointment confirmation email:", err);
              });
            }
          } catch (notifyErr) {
            console.error("Failed to notify patient on appointment confirmation:", notifyErr);
          }
        }

        // Nếu bác sĩ từ chối lịch, thông báo và gửi email cho bệnh nhân
        // Chỉ gửi thông báo + email khi BÁC SĨ/ADMIN từ chối, không gửi khi bệnh nhân tự hủy
        if (status === "cancelled") {
          const isCancelledByDoctor = userId === appointment.doctorId || rejectionReason;
          
          // Kiểm tra user hiện tại có phải bác sĩ/admin không
          let currentUser = await userCollection.findOne({ _id: userId as any });
          if (!currentUser && mongoose.Types.ObjectId.isValid(userId)) {
            currentUser = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
          }
          const isStaffCancelling = currentUser?.role === "doctor" || currentUser?.role === "admin" || isCancelledByDoctor;

          if (isStaffCancelling) {
            // Bác sĩ/Admin từ chối → thông báo và gửi email cho bệnh nhân
            try {
              let doctorObj = await userCollection.findOne({ _id: appointment.doctorId as any });
              if (!doctorObj && mongoose.Types.ObjectId.isValid(appointment.doctorId)) {
                doctorObj = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(appointment.doctorId) });
              }

              let patientObj = await userCollection.findOne({ _id: appointment.patientId as any });
              if (!patientObj && mongoose.Types.ObjectId.isValid(appointment.patientId)) {
                patientObj = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(appointment.patientId) });
              }

              await Notification.create({
                user: appointment.patientId,
                title: "Lịch hẹn đã được từ chối",
                message: `Lịch hẹn của bạn vào ${format(new Date(appointment.date), 'dd/MM/yyyy')} (${appointment.timeSlot}) đã được bác sĩ từ chối${rejectionReason ? ". Lý do: " + rejectionReason : ""}`,
                type: "system",
                link: `/appointments/${id}`,
              });
              try { getIO().emit(`new_notification_${appointment.patientId}`); } catch (e) { /* ignore */ }

              // Gửi email từ chối đến bệnh nhân
              if (patientObj && patientObj.email) {
                const emailHtml = getAppointmentRejectedTemplate(
                  patientObj.name || appointment.patientName || "Bệnh nhân",
                  doctorObj?.name || "Bác sĩ",
                  appointment.date,
                  appointment.timeSlot,
                  rejectionReason
                );
                
                sendMail(
                  patientObj.email,
                  "⚠️ Lịch hẹn khám của bạn đã được từ chối",
                  emailHtml
                ).catch(err => {
                  console.error("Failed to send appointment rejection email:", err);
                });
              }
            } catch (notifyErr) {
              console.error("Failed to notify patient on appointment rejection:", notifyErr);
            }
          } else {
            // Bệnh nhân tự hủy → chỉ thông báo cho bác sĩ (không gửi mail cho bệnh nhân)
            try {
              let patientObj = await userCollection.findOne({ _id: appointment.patientId as any });
              if (!patientObj && mongoose.Types.ObjectId.isValid(appointment.patientId)) {
                patientObj = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(appointment.patientId) });
              }

              await Notification.create({
                user: appointment.doctorId,
                title: "Bệnh nhân đã hủy lịch hẹn",
                message: `Bệnh nhân ${patientObj?.name || appointment.patientName || 'một bệnh nhân'} đã hủy lịch hẹn vào ${format(new Date(appointment.date), 'dd/MM/yyyy')} (${appointment.timeSlot})`,
                type: "system",
                link: `/appointments/${id}`,
              });
              try { getIO().emit(`new_notification_${appointment.doctorId}`); } catch (e) { /* ignore */ }
            } catch (notifyErr) {
              console.error("Failed to notify doctor on patient cancellation:", notifyErr);
            }
          }
        }

        if (status === "completed") {
          try {
            // Generate invoice
            let doctor = await userCollection.findOne({ _id: appointment.doctorId as any });
            if (!doctor && mongoose.Types.ObjectId.isValid(appointment.doctorId)) {
              doctor = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(appointment.doctorId) });
            }
            
            let patientUser = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(appointment.patientId) });
            if (!patientUser && typeof appointment.patientId === "string") {
              patientUser = await userCollection.findOne({ _id: appointment.patientId as any });
            }
            const isAdmitted = patientUser && patientUser.status === "admitted";

            const consultationFee = billing?.consultationFee || doctor?.consultationFee || 200000;

            if (isAdmitted) {
              // Consolidated invoice for inpatients (to be finalized at discharge)
              const items = [
                {
                  description: `Phí khám bệnh - ${doctor?.name || "Bác sĩ"}`,
                  quantity: 1,
                  unitPrice: consultationFee,
                  totalPrice: consultationFee
                }
              ];
              let totalAmount = consultationFee;



              const newInvoice = new Invoice({
                patientId: appointment.patientId,
                status: "pending_payment",
                items,
                totalAmount
              });
              await newInvoice.save();
              await logActivity(userId, "Tạo hóa đơn chi tiết nội trú", `Đã tạo hóa đơn tạm tính tổng cộng ${totalAmount} cho bệnh nhân ID: ${appointment.patientId}`);
            } else {
              // Separate invoices for outpatients (non-admitted)
              // 1. Consultation fee invoice
              const consultationInvoice = new Invoice({
                patientId: appointment.patientId,
                status: "pending_payment",
                items: [
                  {
                    description: `Phí khám bệnh - ${doctor?.name || "Bác sĩ"}`,
                    quantity: 1,
                    unitPrice: consultationFee,
                    totalPrice: consultationFee
                  }
                ],
                totalAmount: consultationFee
              });
              await consultationInvoice.save();
              await logActivity(userId, "Tạo hóa đơn khám bệnh ngoại trú", `Đã tạo hóa đơn phí khám ${consultationFee} cho bệnh nhân ID: ${appointment.patientId}`);


            }
            
            // Notify patient about completed appointment and results
            await Notification.create({
              user: appointment.patientId,
              title: "Kết quả khám đã có",
              message: `Lịch khám của bạn đã hoàn tất. Bạn có thể xem kết quả khám, đơn thuốc và thanh toán hóa đơn.`,
              type: "system",
              link: `/appointments`,
            });
            try { getIO().emit(`new_notification_${appointment.patientId}`); } catch (e) { /* ignore */ }
            
          } catch (err) {
            console.error("Failed to generate invoice or notification for completed appointment:", err);
          }
        }

        await logActivity(userId, "Cập nhật trạng thái lịch hẹn", `Cập nhật lịch hẹn ${id} sang ${status}`);

        res.json(appointment);
      } catch (error) {
        console.error("Error in updateAppointmentStatus:", error);
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
  const parts = timeStr.split(":").map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatTime(date: Date): string {
  return date.toTimeString().substring(0, 5);
}

// Tạo cuộc hẹn vãng lai (Walk-in)
export const createWalkInAppointment = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user.id;
    const { patientId } = req.body;

    const appointment = new Appointment({
      patientId,
      doctorId,
      patientType: "self",
      date: new Date(),
      timeSlot: format(new Date(), "HH:mm"),
      type: "offline",
      symptoms: "Khám trực tiếp (Walk-in)",
      status: "confirmed"
    });

    await appointment.save();
    
    const userCollection = mongoose.connection.collection("user");
    let queryId: any = patientId;
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      queryId = new mongoose.Types.ObjectId(patientId);
    }
    
    const patient = await userCollection.findOne({ _id: queryId as any });
    
    let docQueryId: any = doctorId;
    if (mongoose.Types.ObjectId.isValid(doctorId)) {
      docQueryId = new mongoose.Types.ObjectId(doctorId);
    }
    const doctor = await userCollection.findOne({ _id: docQueryId as any });

    res.status(201).json({ ...appointment.toObject(), patient, doctor });
  } catch (error) {
    console.error("Error creating walk-in appointment:", error);
    res.status(500).json({ message: "Lỗi khi tạo cuộc khám vãng lai" });
  }
};
