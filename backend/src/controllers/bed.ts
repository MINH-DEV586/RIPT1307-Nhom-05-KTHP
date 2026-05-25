import type { Request, Response } from "express";
import Bed from "../models/bed";
import Invoice from "../models/invoice";
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

    // 3. Update User (Inpatient status, Bed ID, and admittedAt)
    const userCollection = mongoose.connection.collection("user");
    const queryId = patientId.length === 24 ? new mongoose.Types.ObjectId(patientId) : patientId;

    await userCollection.updateOne(
      { _id: queryId as any },
      { 
        $set: { 
          status: "admitted",
          patientType: "inpatient",
          assignedBedId: bedId,
          admissionReason: admissionReason,
          admittedAt: new Date()
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
    if (!bed) {
      return res.status(404).json({ message: "Bệnh nhân không ở trong giường nào hoặc đã xuất viện" });
    }

    // 2. Get User to read admittedAt
    const userCollection = mongoose.connection.collection("user");
    const queryId = patientId.length === 24 ? new mongoose.Types.ObjectId(patientId) : patientId;
    const user = await userCollection.findOne({ _id: queryId as any });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy bệnh nhân" });
    }

    // 3. Calculate stay duration and bed fee
    const admittedAt = user.admittedAt ? new Date(user.admittedAt) : new Date(user.createdAt || Date.now());
    const msDiff = new Date().getTime() - admittedAt.getTime();
    const days = Math.max(1, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

    let dailyRate = 200000;
    let bedTypeLabel = "Thường";
    if (bed.type === "vip") {
      dailyRate = 500000;
      bedTypeLabel = "VIP";
    } else if (bed.type === "emergency") {
      dailyRate = 300000;
      bedTypeLabel = "Cấp cứu";
    } else if (bed.type === "rehab") {
      bedTypeLabel = "Phục hồi";
    } else if (bed.type === "disability") {
      bedTypeLabel = "Khuyết tật";
    }

    const totalFee = days * dailyRate;

    // 4. Find/create active invoice and add the finalized bed item
    let inv = await Invoice.findOne({ 
      patientId, 
      status: { $in: ["draft", "pending_payment"] } 
    }).sort({ createdAt: -1 });

    const bedItemDescription = `Phí giường bệnh nội trú (${bedTypeLabel} - ${days} ngày)`;

    if (inv) {
      // Avoid duplicate bed charges in invoice if already added
      const existingItemIndex = inv.items.findIndex(item => item.description.startsWith("Phí giường bệnh nội trú"));
      if (existingItemIndex > -1) {
        inv.totalAmount -= inv.items[existingItemIndex].totalPrice;
        inv.items[existingItemIndex] = {
          description: bedItemDescription,
          quantity: 1,
          unitPrice: totalFee,
          totalPrice: totalFee
        };
      } else {
        inv.items.push({
          description: bedItemDescription,
          quantity: 1,
          unitPrice: totalFee,
          totalPrice: totalFee
        });
      }
      inv.totalAmount += totalFee;
      await inv.save();
    } else {
      inv = new Invoice({
        patientId,
        status: "pending_payment",
        items: [{
          description: bedItemDescription,
          quantity: 1,
          unitPrice: totalFee,
          totalPrice: totalFee
        }],
        totalAmount: totalFee
      });
      await inv.save();
    }

    // 5. Free the bed
    bed.status = "available";
    bed.patientId = undefined;
    await bed.save();

    // 6. Update User status and clear admission data
    await userCollection.updateOne(
      { _id: queryId as any },
      { 
        $set: { 
          status: "discharged",
          patientType: "outpatient",
          assignedBedId: null,
          admittedAt: null
        } 
      }
    );

    await logActivity(
      (req as any).user.id,
      "Cho bệnh nhân xuất viện",
      `Bệnh nhân ${patientId} đã xuất viện và được chốt phí giường ${bed.bedNumber} là ${totalFee.toLocaleString()} VNĐ`
    );

    res.json({ message: "Xuất viện và chốt phí giường bệnh thành công", totalFee });
  } catch (error) {
    console.error("Error in dischargePatientFromBed:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi xuất viện" });
  }
};

