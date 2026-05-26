import type { Request, Response } from "express";
import Prescription from "../models/prescription";
import Medicine from "../models/medicine";
import Dispense from "../models/dispense";
import Invoice from "../models/invoice";
import { logActivity } from "../lib/activity";
import mongoose from "mongoose";

export const getAllPrescriptions = async (req: Request, res: Response) => {
  try {
    const prescriptions = await Prescription.find({ status: "pending" }).sort({ createdAt: -1 }).lean();
    
    const userCollection = mongoose.connection.collection("user");
    
    const prescriptionsWithUsers = await Promise.all(
      prescriptions.map(async (p) => {
        const patient = await userCollection.findOne(
          { _id: new mongoose.Types.ObjectId(p.patientId) },
          { projection: { name: 1, email: 1 } }
        );
        return { ...p, patientName: patient?.name || "Unknown" };
      })
    );

    res.json(prescriptionsWithUsers);
  } catch (error) {
    console.error("Error fetching all pending prescriptions:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getPrescriptionForDispensing = async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;
    
    const prescription = await Prescription.findById(prescriptionId).lean();

    if (!prescription) {
      return res.status(404).json({ message: "Không tìm thấy đơn thuốc" });
    }

    // Get patient and doctor details from 'user' collection
    const userCollection = mongoose.connection.collection("user");
    
    // Better-Auth might store ID in _id or id. Based on invoice.ts, it's likely _id is used for mapping.
    const patient = await userCollection.findOne(
      { _id: new mongoose.Types.ObjectId(prescription.patientId) },
      { projection: { password: 0, emailVerified: 0 } }
    );
    const doctor = await userCollection.findOne(
      { _id: new mongoose.Types.ObjectId(prescription.doctorId) },
      { projection: { password: 0, emailVerified: 0 } }
    );

    const detailedItems = await Promise.all(
      prescription.items.map(async (item: any) => {
        const med = await Medicine.findById(item.medicineId).lean();
        return {
          ...item,
          price: med ? med.price : 0,
        };
      })
    );

    res.json({
      ...prescription,
      items: detailedItems,
      patient,
      doctor
    });
  } catch (error) {
    console.error("Error fetching prescription for dispensing:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi lấy thông tin đơn thuốc" });
  }
};

export const confirmDispense = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { prescriptionId } = req.body;
    const dispensedBy = (req as any).user.id; 

    const prescription = await Prescription.findById(prescriptionId).session(session);

    if (!prescription) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Không tìm thấy đơn thuốc" });
    }

    if (prescription.status !== "pending") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Đơn thuốc này đã được xử lý hoặc bị hủy" });
    }

    // Validate inventory and prepare items for dispense
    const dispenseItems = [];
    for (const item of prescription.items) {
      const medicine = await Medicine.findById(item.medicineId).session(session);
      
      if (!medicine) {
        await session.abortTransaction();
        return res.status(404).json({ message: `Không tìm thấy thuốc: ${item.medicineName}` });
      }

      if (medicine.stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({ 
          message: `Không đủ tồn kho cho thuốc: ${item.medicineName}. Hiện có: ${medicine.stock}, Cần: ${item.quantity}` 
        });
      }

      // Deduct stock
      medicine.stock -= item.quantity;
      await medicine.save({ session });

      dispenseItems.push({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        quantity: item.quantity
      });
    }

    // Create Dispense record
    const newDispense = new Dispense({
      prescriptionId,
      dispensedBy,
      items: dispenseItems,
      dispensedAt: new Date()
    });
    await newDispense.save({ session });

    // Update Prescription status
    prescription.status = "dispensed";
    await prescription.save({ session });

    // Generate Invoice for outpatients
    const userCollection = mongoose.connection.collection("user");
    let patientUser = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(prescription.patientId) });
    if (!patientUser && typeof prescription.patientId === "string") {
      patientUser = await userCollection.findOne({ _id: prescription.patientId as any });
    }
    const isAdmitted = patientUser && patientUser.status === "admitted";

    if (!isAdmitted) {
      let totalPrescriptionFee = 0;
      for (const item of prescription.items) {
        const medicine = await Medicine.findById(item.medicineId).session(session);
        const price = medicine ? medicine.price : 0;
        totalPrescriptionFee += price * item.quantity;
      }

      if (totalPrescriptionFee > 0) {
        const prescriptionInvoice = new Invoice({
          patientId: prescription.patientId,
          status: "pending_payment",
          items: [
            {
              description: `Chi phí đơn thuốc - Chẩn đoán: ${prescription.diagnosis || "Khám bệnh"} (${new Date().toLocaleDateString("vi-VN")})`,
              quantity: 1,
              unitPrice: totalPrescriptionFee,
              totalPrice: totalPrescriptionFee
            }
          ],
          totalAmount: totalPrescriptionFee
        });
        await prescriptionInvoice.save({ session });
        await logActivity(
          dispensedBy,
          "Tạo hóa đơn đơn thuốc ngoại trú",
          `Đã tự động tạo hóa đơn đơn thuốc ${totalPrescriptionFee} cho bệnh nhân ID: ${prescription.patientId}`
        );
      }
    }

    // Log activity
    await logActivity(
      dispensedBy,
      "Phát thuốc",
      `Đã phát thuốc cho đơn thuốc ID: ${prescriptionId}`
    );

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Phát thuốc thành công", dispenseId: newDispense._id });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error confirming dispense:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi xác nhận phát thuốc" });
  }
};
