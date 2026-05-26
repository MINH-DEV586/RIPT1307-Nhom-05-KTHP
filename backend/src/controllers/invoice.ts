import invoice from "../models/invoice";
import Bed from "../models/bed";
import Prescription from "../models/prescription";
import Medicine from "../models/medicine";
import LabRequest from "../models/labRequest";
import LabTest from "../models/labTest";
import type { Request, Response } from "express";
import { logActivity } from "../lib/activity";
import mongoose from "mongoose";

export const getMyActiveInvoice = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    if (!patientId || typeof patientId !== "string") {
      return res.status(400).json({ message: "ID bệnh nhân không hợp lệ" });
    }
    let inv = await invoice
      .findOne({ patientId, status: { $in: ["draft", "pending_payment"] } })
      .sort({ createdAt: -1 });

    // Look up user to see if they are currently admitted
    const userCollection = mongoose.connection.collection("user");
    const queryId = patientId.length === 24 ? new mongoose.Types.ObjectId(patientId) : patientId;
    const user = await userCollection.findOne({ _id: queryId as any });

    if (user && user.status === "admitted" && user.assignedBedId) {
      const bed = await Bed.findById(user.assignedBedId);
      if (bed) {
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
        const existingInvoices = await invoice.find({ patientId }).lean();

        // Fetch all prescriptions dispensed during their stay (allow up to 6h before admission to catch consultation prescriptions)
        const prescriptionSince = new Date(admittedAt.getTime() - 6 * 60 * 60 * 1000);
        const prescriptions = await Prescription.find({
          patientId,
          status: "dispensed",
          createdAt: { $gte: prescriptionSince }
        }).lean();

        const prescriptionItems = [];
        let totalPrescriptionFee = 0;

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
            const isBilled = existingInvoices.some(inv =>
              inv.items.some(item =>
                item.description.startsWith("Chi phí đơn thuốc") &&
                item.description.includes(`Chẩn đoán: ${diagStr}`) &&
                item.totalPrice === prescriptionTotal
              )
            );

            if (!isBilled) {
              prescriptionItems.push({
                description: `Chi phí đơn thuốc  - Chẩn đoán: ${p.diagnosis} (${new Date((p as any).createdAt).toLocaleDateString("vi-VN")})`,
                quantity: 1,
                unitPrice: prescriptionTotal,
                totalPrice: prescriptionTotal,
                isEstimated: true
              });
              totalPrescriptionFee += prescriptionTotal;
            }
          }
        }

        // Fetch all completed lab requests during their stay (allow up to 6h before admission to catch consultation lab requests)
        const labRequestSince = new Date(admittedAt.getTime() - 6 * 60 * 60 * 1000);
        const labRequests = await LabRequest.find({
          patientId,
          status: "completed",
          createdAt: { $gte: labRequestSince }
        }).lean();

        const labItems = [];
        let totalLabFee = 0;

        for (const lr of labRequests) {
          const labTest = await LabTest.findOne({ name: lr.testType, isActive: true }).lean();
          const labFee = labTest?.price || 0;
          if (labFee > 0) {
            const lrDateStr = new Date((lr as any).createdAt).toLocaleDateString("vi-VN");
            // Check if this lab request is already billed in any other database invoice
            const isBilled = existingInvoices.some(existingInv =>
              (!inv || existingInv._id.toString() !== inv._id.toString()) &&
              existingInv.items.some(item =>
                (item.description.startsWith("Chi phí xét nghiệm -") ||
                 item.description.startsWith("Chi phí xét nghiệm (Tạm tính) -") ||
                 item.description.startsWith("Chi phí xét nghiệm & Cận lâm sàng")) &&
                item.description.includes(lr.testType) &&
                item.description.includes(lrDateStr)
              )
            );

            if (!isBilled) {
              labItems.push({
                description: `Chi phí xét nghiệm (Tạm tính) - ${lr.testType} (${new Date((lr as any).createdAt).toLocaleDateString("vi-VN")})`,
                quantity: 1,
                unitPrice: labFee,
                totalPrice: labFee,
                isEstimated: true
              });
              totalLabFee += labFee;
            }
          }
        }

        // If no active invoice exists in the DB, mock a draft one so we can show the bed fee
        let responseInvoice: any;
        if (!inv) {
          responseInvoice = {
            _id: "temp-bed-invoice",
            patientId,
            status: "draft",
            items: [
              {
                description: `Phí giường bệnh nội trú (Tạm tính - ${bedTypeLabel} - ${days} ngày)`,
                quantity: 1,
                unitPrice: totalFee,
                totalPrice: totalFee,
                isEstimated: true
              },
              ...prescriptionItems,
              ...labItems
            ],
            totalAmount: totalFee + totalPrescriptionFee + totalLabFee,
            createdAt: admittedAt,
            updatedAt: new Date(),
            isEstimatedInvoice: true
          };
        } else {
          // Filter out existing stay items to avoid duplicates
          const baseItems = inv.items.filter(item =>
            !item.description.startsWith("Phí giường bệnh nội trú") &&
            !item.description.startsWith("Chi phí đơn thuốc (Tạm tính)") &&
            !item.description.startsWith("Chi phí đơn thuốc - Chẩn đoán:") &&
            !item.description.startsWith("Chi phí xét nghiệm (Tạm tính)")
          );

          const baseTotal = baseItems.reduce((sum, item) => sum + item.totalPrice, 0);

          const updatedItems = [
            ...baseItems,
            {
              description: `Phí giường bệnh nội trú (Tạm tính - ${bedTypeLabel} - ${days} ngày)`,
              quantity: 1,
              unitPrice: totalFee,
              totalPrice: totalFee,
              isEstimated: true
            },
            ...prescriptionItems,
            ...labItems
          ];

          responseInvoice = {
            ...inv.toObject(),
            items: updatedItems,
            totalAmount: baseTotal + totalFee + totalPrescriptionFee + totalLabFee,
            isEstimatedInvoice: true
          };
        }

        return res.json([responseInvoice]);
      }
    }

    // Non-admitted patients: return all active invoices as an array
    let invs = await invoice
      .find({ patientId, status: { $in: ["draft", "pending_payment"] } })
      .sort({ createdAt: -1 });

    if (!invs || invs.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn đang hoạt động" });
    }
    res.json(invs);
  } catch (error) {
    console.error("Error fetching active invoice:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getBillingHistory = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params; // route is /history/:id
    const history = await invoice
      .find({ patientId, status: "paid" })
      .sort({ updatedAt: -1 });

    res.json(history);
  } catch (error) {
    console.error("Error fetching billing history:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const total = await invoice.countDocuments();
    const collection = mongoose.connection.collection("user");

    const invoices = await invoice
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const invoicesWithUser = await Promise.all(
      invoices.map(async (inv) => {
        try {
          // Better Auth IDs are usually strings. 
          // But they might be stored as ObjectIds in the 'user' collection.
          let queryId: any = inv.patientId;
          if (mongoose.Types.ObjectId.isValid(inv.patientId)) {
            queryId = new mongoose.Types.ObjectId(inv.patientId);
          }

          const user = await collection.findOne(
            { $or: [{ _id: queryId }, { _id: inv.patientId as any }] },
            { projection: { password: 0, emailVerified: 0 } },
          );
          return { ...inv, user };
        } catch (err) {
          console.error(`Error looking up user ${inv.patientId}:`, err);
          return { ...inv, user: null };
        }
      }),
    );

    res.json({
      res: invoicesWithUser,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalData: total,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching all invoices:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // ✅ read from /:id/checkout route params
    const inv = await invoice.findById(id);

    if (!inv) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    }

    inv.status = "paid";
    await inv.save();

    await logActivity(
      (req as any).user.id,
      "Thanh toán hóa đơn",
      `Hóa đơn ${id} đã được đánh dấu là đã thanh toán`,
    );

    res.json({
      checkoutUrl: `/profile/${inv.patientId}`,
      message: "Thanh toán thành công",
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
