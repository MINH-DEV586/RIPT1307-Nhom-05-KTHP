import type { Request, Response } from "express";
import Prescription from "../models/prescription";
import Medicine from "../models/medicine";
import MedicalRecord from "../models/medicalRecord";
import { logActivity } from "../lib/activity";
import mongoose from "mongoose";
import Notification from "../models/notification";
import { getIO } from "../lib/socket";


export const getMedicines = async (req: Request, res: Response) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách thuốc" });
  }
};

export const createPrescription = async (req: Request, res: Response) => {
  try {
    const { patientId, diagnosis, items, notes } = req.body;
    const doctorId = (req as any).user.id;

    if (!patientId || !items || items.length === 0) {
      return res.status(400).json({ message: "Thông tin bệnh nhân và thuốc là bắt buộc" });
    }

    const newPrescription = new Prescription({
      patientId,
      doctorId,
      diagnosis,
      items,
      notes,
      status: "pending"
    });

    await newPrescription.save();

    // Thông báo cho bệnh nhân rằng có đơn thuốc mới
    try {
      await Notification.create({
        user: patientId,
        title: "Bạn có đơn thuốc mới",
        message: `Bác sĩ đã thêm đơn thuốc cho bạn. Vui lòng kiểm tra phần Đơn thuốc.`,
        type: "assignment",
        link: `/patient/prescriptions`,
      });
      try { getIO().emit(`new_notification_${patientId}`); } catch (e) { /* ignore */ }
    } catch (notifyErr) {
      console.error("Failed to create notification for prescription:", notifyErr);
    }

    // Tự động gẫn vào hồ sơ nội trú mới nhất nếu bệnh nhân đang nằm viện
    try {
      const userCollection = mongoose.connection.collection("user");
      const patient = await userCollection.findOne({ _id: patientId as any }, { projection: { status: 1 } });
      const inpatientStatuses = ["admitted", "in_treatment", "observation"];

      if (patient && inpatientStatuses.includes(patient.status)) {
        const latestRecord = await MedicalRecord.findOne(
          { patient: patientId, recordType: "inpatient" },
          null,
          { sort: { date: -1 } }
        );
        if (latestRecord) {
          await MedicalRecord.findByIdAndUpdate(
            latestRecord._id,
            { $addToSet: { prescriptionIds: newPrescription._id.toString() } }
          );
        }
      }
    } catch (linkErr) {
      // Không làm hỏng flow chính nếu link thất bại
      console.warn("Could not auto-link prescription to medical record:", linkErr);
    }

    await logActivity(
      doctorId,
      "Kê đơn thuốc",
      `Đã kê đơn thuốc cho bệnh nhân ID: ${patientId}`
    );

    res.status(201).json(newPrescription);
  } catch (error) {
    console.error("Error creating prescription:", error);
    res.status(500).json({ message: "Lỗi khi tạo đơn thuốc" });
  }
};


export const getPrescriptions = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId } = req.query;
    const filter: any = {};
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;

    const prescriptions = await Prescription.find(filter).sort({ createdAt: -1 }).lean();
    
    const userCollection = mongoose.connection.collection("user");
    
    const detailedPrescriptions = await Promise.all(
      prescriptions.map(async (p) => {
        // Safe ID handling for patient
        let patientQueryId: any = p.patientId;
        if (mongoose.Types.ObjectId.isValid(p.patientId)) patientQueryId = new mongoose.Types.ObjectId(p.patientId);
        
        // Safe ID handling for doctor
        let doctorQueryId: any = p.doctorId;
        if (mongoose.Types.ObjectId.isValid(p.doctorId)) doctorQueryId = new mongoose.Types.ObjectId(p.doctorId);

        const patient = await userCollection.findOne(
          { _id: patientQueryId },
          { projection: { name: 1 } }
        );
        const doctor = await userCollection.findOne(
          { _id: doctorQueryId },
          { projection: { name: 1 } }
        );
        const detailedItems = await Promise.all(
          p.items.map(async (item: any) => {
            const med = await Medicine.findById(item.medicineId).lean();
            return {
              ...item,
              price: med ? med.price : 0,
            };
          })
        );
        return { 
          ...p, 
          items: detailedItems,
          patientName: patient?.name || "N/A",
          doctorName: doctor?.name || "N/A"
        };
      })
    );

    res.json(detailedPrescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đơn thuốc" });
  }
};

export const getPrescriptionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findById(id).lean();
    if (!prescription) return res.status(404).json({ message: "Không tìm thấy đơn thuốc" });

    const userCollection = mongoose.connection.collection("user");
    
    let patientQueryId: any = prescription.patientId;
    if (mongoose.Types.ObjectId.isValid(prescription.patientId)) patientQueryId = new mongoose.Types.ObjectId(prescription.patientId);
    
    let doctorQueryId: any = prescription.doctorId;
    if (mongoose.Types.ObjectId.isValid(prescription.doctorId)) doctorQueryId = new mongoose.Types.ObjectId(prescription.doctorId);

    const patient = await userCollection.findOne({ _id: patientQueryId });
    const doctor = await userCollection.findOne({ _id: doctorQueryId });

    const detailedItems = await Promise.all(
      prescription.items.map(async (item: any) => {
        const med = await Medicine.findById(item.medicineId).lean();
        return {
          ...item,
          price: med ? med.price : 0,
        };
      })
    );

    res.json({ ...prescription, items: detailedItems, patient, doctor });
  } catch (error) {
    console.error("Error fetching prescription by ID:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
