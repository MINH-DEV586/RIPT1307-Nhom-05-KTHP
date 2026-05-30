import invoice from "../models/invoice";
import Bed from "../models/bed";
import Prescription from "../models/prescription";
import Medicine from "../models/medicine";
import LabRequest from "../models/labRequest";
import LabTest from "../models/labTest";
import type { Request, Response } from "express";
import { logActivity } from "../lib/activity";
import mongoose from "mongoose";
import { getIO } from "../lib/socket";
import crypto from "crypto";

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
    let queryId: any = patientId;
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      queryId = new mongoose.Types.ObjectId(patientId);
    }
    const user = await userCollection.findOne({ $or: [{ _id: queryId }, { _id: patientId }] });

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

        // Fetch all prescriptions dispensed during their stay (allow up to 24h before admission to catch consultation prescriptions)
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
              prescriptionItems.push({
                description: `Chi phí đơn thuốc - Chẩn đoán: ${p.diagnosis} (${pDateStr})`,
                quantity: 1,
                unitPrice: prescriptionTotal,
                totalPrice: prescriptionTotal,
                isEstimated: true
              });
              totalPrescriptionFee += prescriptionTotal;
            }
          }
        }

        // Fetch all completed lab requests during their stay (allow up to 24h before admission to catch consultation lab requests)
        const labRequestSince = new Date(admittedAt.getTime() - 24 * 60 * 60 * 1000);
        const labRequests = await LabRequest.find({
          patientId: { $in: [patientId, queryId] },
          status: "completed",
          createdAt: { $gte: labRequestSince }
        }).lean();

        const labItems = [];
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
                description: `Chi phí xét nghiệm (Tạm tính) - ${lr.testType} (${lrDateStr})`,
                quantity: 1,
                unitPrice: labFee,
                totalPrice: labFee,
                isEstimated: true
              });
              totalLabFee += labFee;
            }
          }
        }

        // Instead of mocking, we save these dynamic items to the actual invoice in the DB
        if (!inv) {
          inv = new invoice({
            patientId,
            status: "pending_payment",
            items: [],
            totalAmount: 0,
          });
        }

        // Calculate already billed bed fees
        let billedBedFee = 0;
        for (const existingInv of existingInvoices) {
          if (inv && existingInv._id.toString() === inv._id.toString()) continue;
          for (const item of existingInv.items) {
            if (item.description.startsWith("Phí giường bệnh nội trú")) {
              billedBedFee += item.totalPrice;
            }
          }
        }

        const remainingBedFee = Math.max(0, totalFee - billedBedFee);

        // Filter out old estimated items to avoid duplicates
        const baseItems = inv.items ? inv.items.filter((item: any) =>
          !item.description.startsWith("Phí giường bệnh nội trú") &&
          !item.description.startsWith("Chi phí đơn thuốc") &&
          !item.description.startsWith("Chi phí xét nghiệm")
        ) : [];

        const baseTotal = baseItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

        const updatedItems = [...baseItems, ...prescriptionItems, ...labItems];

        if (remainingBedFee > 0) {
          updatedItems.push({
            description: `Phí giường bệnh nội trú (Tạm tính phần mới - ${bedTypeLabel} - ${days} ngày)`,
            quantity: 1,
            unitPrice: remainingBedFee,
            totalPrice: remainingBedFee,
            isEstimated: true
          });
        }

        inv.items = updatedItems;
        inv.totalAmount = baseTotal + remainingBedFee + totalPrescriptionFee + totalLabFee;
        inv.isEstimatedInvoice = true;
        
        // Only save if there's actually something to pay, or if it already existed in the DB with a real ID
        if (inv.totalAmount > 0 || !inv.isNew) {
          await inv.save();
        }

        const otherInvs = await invoice
          .find({
            patientId,
            status: { $in: ["draft", "pending_payment"] },
            _id: { $ne: inv._id }
          })
          .sort({ createdAt: -1 });

        const invoicesToReturn = [...otherInvs];
        if (inv.totalAmount > 0 || !inv.isNew) {
          invoicesToReturn.unshift(inv);
        }

        return res.json(invoicesToReturn);
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

// ============================================================
// VNPay QR Payment (Giả lập / Simulation)
// ============================================================

/**
 * POST /api/invoices/:id/vnpay-checkout
 * Tạo dữ liệu QR giả lập VNPay và trả về cho frontend hiển thị
 */
export const createVNPayCheckout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const inv = await invoice.findById(id);

    if (!inv) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    }

    if (inv.status === "paid") {
      return res.status(400).json({ message: "Hóa đơn đã được thanh toán" });
    }

    // Tạo mã giao dịch giả lập
    const txnRef = crypto.randomBytes(8).toString("hex").toUpperCase();
    inv.vnpayTxnRef = txnRef;
    await inv.save();

    // Nội dung QR: chuỗi giả lập VNPay định dạng VNPAYQR
    const qrContent = [
      `VNPAYQR`,
      `TxnRef:${txnRef}`,
      `Amount:${inv.totalAmount}`,
      `OrderInfo:Thanh toan hoa don benh vien`,
      `InvoiceId:${id}`,
    ].join("|");

    res.json({
      txnRef,
      qrContent,
      amount: inv.totalAmount,
      invoiceId: id,
      message: "QR tạo thành công",
    });
  } catch (error) {
    console.error("Error creating VNPay checkout:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

/**
 * POST /api/invoices/:id/confirm-payment
 * Xác nhận thanh toán thành công (giả lập) + emit socket event
 */
export const confirmVNPayPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { txnRef } = req.body;

    const inv = await invoice.findById(id);
    if (!inv) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    }

    // Kiểm tra mã giao dịch khớp
    if (inv.vnpayTxnRef && inv.vnpayTxnRef !== txnRef) {
      return res.status(400).json({ message: "Mã giao dịch không hợp lệ" });
    }

    if (inv.status === "paid") {
      return res.status(400).json({ message: "Hóa đơn đã được thanh toán" });
    }

    inv.status = "paid";
    await inv.save();

    await logActivity(
      (req as any).user.id,
      "Thanh toán VNPay QR",
      `Hóa đơn ${id} đã được thanh toán qua VNPay QR (mã: ${txnRef})`,
    );

    // Emit socket event để frontend cập nhật real-time
    try {
      const io = getIO();
      // Gửi tới bệnh nhân theo patientId (socket room "user_<patientId>" nếu có, hoặc broadcast)
      io.emit("payment_confirmed", {
        invoiceId: id,
        patientId: inv.patientId,
        txnRef,
        amount: inv.totalAmount,
      });
    } catch (socketErr) {
      console.error("Socket emit error (non-critical):", socketErr);
    }

    res.json({
      message: "Thanh toán thành công",
      invoiceId: id,
      txnRef,
    });
  } catch (error) {
    console.error("Error confirming VNPay payment:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
