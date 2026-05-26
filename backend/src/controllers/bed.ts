import type { Request, Response } from "express";
import Bed from "../models/bed";
import Invoice from "../models/invoice";
import Prescription from "../models/prescription";
import Medicine from "../models/medicine";
import LabRequest from "../models/labRequest";
import LabTest from "../models/labTest";
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
    if (!patientId || typeof patientId !== "string") {
      return res.status(400).json({ message: "ID bệnh nhân không hợp lệ" });
    }

    // 1. Find the bed occupied by this patient
    const bed = await Bed.findOne({ patientId });
    if (!bed) {
      return res.status(404).json({ message: "Bệnh nhân không ở trong giường nào hoặc đã xuất viện" });
    }

    // 2. Get User to read admittedAt
    const userCollection = mongoose.connection.collection("user");
    let queryId: any = patientId;
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      queryId = new mongoose.Types.ObjectId(patientId);
    }
    const user = await userCollection.findOne({ $or: [{ _id: queryId }, { _id: patientId }] });
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

    // Fetch all existing invoices for this patient to filter out already-billed prescriptions
    const existingInvoices = await Invoice.find({ patientId }).lean();

    // 4. Find active invoice
    let inv = await Invoice.findOne({
      patientId,
      status: { $in: ["draft", "pending_payment"] }
    }).sort({ createdAt: -1 });

    // Find all prescriptions for this patient during their stay (allow up to 24h before admission)
    const prescriptionSince = new Date(admittedAt.getTime() - 24 * 60 * 60 * 1000);
    const prescriptions = await Prescription.find({
      patientId: { $in: [patientId, queryId] },
      status: "dispensed",
      createdAt: { $gte: prescriptionSince }
    }).lean();

    const prescriptionItems = [];
    let totalPrescriptionFee = 0;

    // List of all billed prescription items from existing invoices (excluding active inv)
    const billedPrescriptionItems: Array<{ description: string; price: number }> = [];
    for (const existingInv of existingInvoices) {
      if (inv && existingInv._id.toString() === inv._id.toString()) continue;
      for (const item of existingInv.items) {
        if (item.description.startsWith("Chi phí đơn thuốc")) {
          billedPrescriptionItems.push({ description: item.description, price: item.totalPrice });
        }
      }
    }

    for (const p of prescriptions) {
      let prescriptionTotal = 0;
      for (const item of p.items) {
        const med = await Medicine.findById(item.medicineId).lean();
        const price = med ? med.price : 0;
        prescriptionTotal += price * item.quantity;
      }

      if (prescriptionTotal > 0) {
        // Check if this prescription is already billed in any database invoice
        const diagStr = p.diagnosis || "Khám bệnh";
        const pDateStr = new Date((p as any).createdAt).toLocaleDateString("vi-VN");
        
        const matchIndex = billedPrescriptionItems.findIndex(billedItem =>
          billedItem.description.startsWith("Chi phí đơn thuốc") &&
          billedItem.description.includes(`Chẩn đoán: ${diagStr}`) &&
          billedItem.description.includes(pDateStr) &&
          billedItem.price === prescriptionTotal
        );

        let isBilled = false;
        if (matchIndex !== -1) {
          billedPrescriptionItems.splice(matchIndex, 1);
          isBilled = true;
        }

        if (!isBilled) {
          const desc = `Chi phí đơn thuốc - Chẩn đoán: ${p.diagnosis} (${pDateStr})`;
          prescriptionItems.push({
            description: desc,
            quantity: 1,
            unitPrice: prescriptionTotal,
            totalPrice: prescriptionTotal
          });
          totalPrescriptionFee += prescriptionTotal;
        }
      }
    }

    // Find all completed lab requests for this patient during their stay (allow up to 24h before admission)
    const labRequestSince = new Date(admittedAt.getTime() - 24 * 60 * 60 * 1000);
    const labRequests = await LabRequest.find({
      patientId: { $in: [patientId, queryId] },
      status: "completed",
      createdAt: { $gte: labRequestSince }
    }).lean();

    const labItems: any[] = [];
    let totalLabFee = 0;

    // List of all billed lab items from existing invoices (excluding active inv)
    const billedLabItems: Array<{ description: string; price: number }> = [];
    for (const existingInv of existingInvoices) {
      if (inv && existingInv._id.toString() === inv._id.toString()) continue;
      for (const item of existingInv.items) {
        if (
          item.description.startsWith("Chi phí xét nghiệm -") ||
          item.description.startsWith("Chi phí xét nghiệm (Tạm tính) -") ||
          item.description.startsWith("Chi phí xét nghiệm & Cận lâm sàng")
        ) {
          billedLabItems.push({ description: item.description, price: item.totalPrice });
        }
      }
    }

    for (const lr of labRequests) {
      const labTest = await LabTest.findOne({ name: lr.testType, isActive: true }).lean();
      const labFee = labTest?.price || 0;
      if (labFee > 0) {
        const lrDateStr = new Date((lr as any).createdAt).toLocaleDateString("vi-VN");
        // Check if this lab request is already billed in any other database invoice
        const matchIndex = billedLabItems.findIndex(billedItem =>
          (billedItem.description.startsWith("Chi phí xét nghiệm -") ||
            billedItem.description.startsWith("Chi phí xét nghiệm (Tạm tính) -") ||
            billedItem.description.startsWith("Chi phí xét nghiệm & Cận lâm sàng")) &&
          billedItem.description.includes(lr.testType) &&
          billedItem.description.includes(lrDateStr) &&
          billedItem.price === labFee
        );

        let isBilled = false;
        if (matchIndex !== -1) {
          billedLabItems.splice(matchIndex, 1);
          isBilled = true;
        }

        if (!isBilled) {
          labItems.push({
            description: `Chi phí xét nghiệm - ${lr.testType} (${lrDateStr})`,
            quantity: 1,
            unitPrice: labFee,
            totalPrice: labFee
          });
          totalLabFee += labFee;
        }
      }
    }

    // 4. Finalize bed, prescription & lab items on active invoice

    const bedItemDescription = `Phí giường bệnh nội trú (${bedTypeLabel} - ${days} ngày)`;

    if (inv) {
      // Filter out existing bed, prescription and lab items from this stay to avoid duplicates
      const filteredItems = inv.items.filter(item =>
        !item.description.startsWith("Phí giường bệnh nội trú") &&
        !item.description.startsWith("Chi phí đơn thuốc") &&
        !item.description.startsWith("Chi phí xét nghiệm")
      );

      // Calculate total amount of remaining items
      let newTotal = filteredItems.reduce((sum, item) => sum + item.totalPrice, 0);

      // Add the new bed item
      filteredItems.push({
        description: bedItemDescription,
        quantity: 1,
        unitPrice: totalFee,
        totalPrice: totalFee
      });
      newTotal += totalFee;

      // Add the prescription items
      for (const item of prescriptionItems) {
        filteredItems.push(item);
        newTotal += item.totalPrice;
      }

      // Add the lab items
      for (const item of labItems) {
        filteredItems.push(item);
        newTotal += item.totalPrice;
      }

      inv.items = filteredItems;
      inv.totalAmount = newTotal;
      await inv.save();
    } else {
      const items: any[] = [{
        description: bedItemDescription,
        quantity: 1,
        unitPrice: totalFee,
        totalPrice: totalFee
      }];

      let newTotal = totalFee;

      for (const item of prescriptionItems) {
        items.push(item);
        newTotal += item.totalPrice;
      }

      for (const item of labItems) {
        items.push(item);
        newTotal += item.totalPrice;
      }

      inv = new Invoice({
        patientId,
        status: "pending_payment",
        items,
        totalAmount: newTotal
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

