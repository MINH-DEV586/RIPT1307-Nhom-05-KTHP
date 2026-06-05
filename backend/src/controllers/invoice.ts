import invoice from "../models/invoice";
import Bed from "../models/bed";
import Prescription from "../models/prescription";
import Medicine from "../models/medicine";
import LabRequest from "../models/labRequest";
import LabTest from "../models/labTest";
import Notification from "../models/notification";
import type { Request, Response } from "express";
import { logActivity } from "../lib/activity";
import mongoose from "mongoose";
import { getIO } from "../lib/socket";
import crypto from "crypto";
import { sendMail, getPaymentConfirmationTemplate } from "../lib/mailer";

export const getMyActiveInvoice = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    if (!patientId || typeof patientId !== "string") {
      return res.status(400).json({ message: "ID bệnh nhân không hợp lệ" });
    }

    // Look up user to check admission status
    const userCollection = mongoose.connection.collection("user");
    let queryId: any = patientId;
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      queryId = new mongoose.Types.ObjectId(patientId);
    }
    const user = await userCollection.findOne({ $or: [{ _id: queryId }, { _id: patientId }] });

    // ─────────────────────────────────────────────────────────────
    // INPATIENT (admitted): Tính hóa đơn hợp nhất nhưng chỉ cho
    // thanh toán khi bệnh nhân đã xuất viện (discharged)
    // ─────────────────────────────────────────────────────────────
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
        const existingInvoices = await invoice.find({ patientId }).lean();

        let inv = await invoice
          .findOne({ patientId, status: { $in: ["draft", "pending_payment"] } })
          .sort({ createdAt: -1 });

        // ── Prescriptions ──
        const prescriptionSince = new Date(admittedAt.getTime() - 24 * 60 * 60 * 1000);
        const prescriptions = await Prescription.find({
          patientId: { $in: [patientId, queryId] },
          status: "dispensed",
          createdAt: { $gte: prescriptionSince }
        }).lean();

        const prescriptionItems = [];
        let totalPrescriptionFee = 0;
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
            prescriptionTotal += (med ? med.price : 0) * item.quantity;
          }
          if (prescriptionTotal > 0) {
            const diagStr = p.diagnosis || "Khám bệnh";
            const pDateStr = new Date((p as any).createdAt).toLocaleDateString("vi-VN");
            const matchIndex = billedPrescriptionItems.findIndex(b =>
              b.description.includes(`Chẩn đoán: ${diagStr}`) &&
              b.description.includes(pDateStr) &&
              b.price === prescriptionTotal
            );
            if (matchIndex !== -1) {
              billedPrescriptionItems.splice(matchIndex, 1);
            } else {
              prescriptionItems.push({
                description: `Chi phí đơn thuốc - Chẩn đoán: ${p.diagnosis} (${pDateStr})`,
                quantity: 1, unitPrice: prescriptionTotal, totalPrice: prescriptionTotal, isEstimated: true
              });
              totalPrescriptionFee += prescriptionTotal;
            }
          }
        }

        // ── Lab Requests ──
        const labRequestSince = new Date(admittedAt.getTime() - 24 * 60 * 60 * 1000);
        const labRequests = await LabRequest.find({
          patientId: { $in: [patientId, queryId] },
          status: "completed",
          createdAt: { $gte: labRequestSince }
        }).lean();

        const labItems = [];
        let totalLabFee = 0;
        const billedLabItems: Array<{ description: string; price: number }> = [];
        for (const existingInv of existingInvoices) {
          if (inv && existingInv._id.toString() === inv._id.toString()) continue;
          for (const item of existingInv.items) {
            if (item.description.startsWith("Chi phí xét nghiệm")) {
              billedLabItems.push({ description: item.description, price: item.totalPrice });
            }
          }
        }
        for (const lr of labRequests) {
          const labTest = await LabTest.findOne({ name: lr.testType, isActive: true }).lean();
          const labFee = labTest?.price || 0;
          if (labFee > 0) {
            const lrDateStr = new Date((lr as any).createdAt).toLocaleDateString("vi-VN");
            const matchIndex = billedLabItems.findIndex(b =>
              b.description.includes(lr.testType) &&
              b.description.includes(lrDateStr) &&
              b.price === labFee
            );
            if (matchIndex !== -1) {
              billedLabItems.splice(matchIndex, 1);
            } else {
              labItems.push({
                description: `Chi phí xét nghiệm (Tạm tính) - ${lr.testType} (${lrDateStr})`,
                quantity: 1, unitPrice: labFee, totalPrice: labFee, isEstimated: true
              });
              totalLabFee += labFee;
            }
          }
        }

        // ── Build / Update Invoice ──
        if (!inv) {
          inv = new invoice({ patientId, status: "pending_payment", items: [], totalAmount: 0 });
        }

        let billedBedFee = 0;
        for (const existingInv of existingInvoices) {
          if (inv && existingInv._id.toString() === inv._id.toString()) continue;
          for (const item of existingInv.items) {
            if (item.description.startsWith("Phí giường bệnh nội trú")) billedBedFee += item.totalPrice;
          }
        }
        const remainingBedFee = Math.max(0, totalFee - billedBedFee);

        const baseItems = inv.items ? inv.items.filter((item: any) =>
          !item.description.startsWith("Phí giường bệnh nội trú") &&
          !item.description.startsWith("Chi phí đơn thuốc") &&
          !item.description.startsWith("Chi phí xét nghiệm")
        ) : [];
        const baseTotal = baseItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

        const updatedItems = [...baseItems, ...prescriptionItems, ...labItems];
        if (remainingBedFee > 0) {
          updatedItems.push({
            description: `Phí giường bệnh nội trú (Tạm tính - ${bedTypeLabel} - ${days} ngày)`,
            quantity: 1, unitPrice: remainingBedFee, totalPrice: remainingBedFee, isEstimated: true
          });
        }

        inv.items = updatedItems;
        inv.totalAmount = baseTotal + remainingBedFee + totalPrescriptionFee + totalLabFee;
        inv.isEstimatedInvoice = true;
        const isNew = inv.isNew;
        if (inv.totalAmount > 0 || !inv.isNew) await inv.save();

        // Gửi notification khi tạo hóa đơn mới lần đầu
        if (isNew && inv.totalAmount > 0) {
          try {
            await Notification.create({
              user: patientId,
              title: "Hóa đơn mới cần thanh toán",
              message: `Bạn có hóa đơn nội trú tạm tính ${inv.totalAmount.toLocaleString("vi-VN")} VNĐ đang chờ thanh toán.`,
              type: "invoice",
              link: "/patient/invoices",
            });
            // Emit socket để badge cập nhật real-time
            const io = getIO();
            io.emit("notification_received");
          } catch (notifyErr) {
            console.error("Failed to create invoice notification:", notifyErr);
          }
        }

        const otherInvs = await invoice
          .find({ patientId, status: { $in: ["draft", "pending_payment"] }, _id: { $ne: inv._id } })
          .sort({ createdAt: -1 });

        const invoicesToReturn: any[] = [...otherInvs];
        if (inv.totalAmount > 0 || !inv.isNew) invoicesToReturn.unshift(inv);

        // Trả về kèm flag patientIsAdmitted = true để frontend biết ẩn nút thanh toán
        return res.json({ invoices: invoicesToReturn, patientIsAdmitted: true });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // OUTPATIENT (non-admitted / discharged): Gộp tất cả invoice
    // pending thành 1 hóa đơn hợp nhất duy nhất
    // ─────────────────────────────────────────────────────────────
    const pendingInvs = await invoice
      .find({ patientId, status: { $in: ["draft", "pending_payment"] } })
      .sort({ createdAt: 1 })
      .lean();

    if (!pendingInvs || pendingInvs.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn đang hoạt động" });
    }

    // Nếu chỉ có 1 invoice thì trả về luôn
    if (pendingInvs.length === 1) {
      return res.json({ invoices: pendingInvs, patientIsAdmitted: false });
    }

    // Có nhiều invoices → merge vào invoice cuối cùng (mới nhất)
    const latestInv = await invoice.findById(pendingInvs[pendingInvs.length - 1]._id);
    if (!latestInv) {
      return res.json({ invoices: pendingInvs.slice(-1), patientIsAdmitted: false });
    }

    const olderInvs = pendingInvs.slice(0, -1);
    const mergedItems: any[] = [...latestInv.items];

    for (const oldInv of olderInvs) {
      for (const item of oldInv.items) {
        // Tránh trùng lặp: kiểm tra description + price
        const alreadyExists = mergedItems.some(
          (m) => m.description === item.description && m.totalPrice === item.totalPrice
        );
        if (!alreadyExists) {
          mergedItems.push(item);
        }
      }
    }

    latestInv.items = mergedItems;
    latestInv.totalAmount = mergedItems.reduce((s: number, i: any) => s + i.totalPrice, 0);
    await latestInv.save();

    // Đánh dấu các invoices cũ đã được merge (chuyển sang paid để khỏi trùng)
    const olderIds = olderInvs.map((i) => i._id);
    await invoice.updateMany(
      { _id: { $in: olderIds } },
      { $set: { status: "merged" as any } }
    );

    return res.json({ invoices: [latestInv], patientIsAdmitted: false });
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

    // Check if upgrading to pro
    const hasProUpgrade = inv.items.some((item: any) => item.description === "Nâng cấp tài khoản Pro");
    if (hasProUpgrade) {
      const userCollection = mongoose.connection.collection("user");
      let queryId: any = inv.patientId;
      if (mongoose.Types.ObjectId.isValid(inv.patientId)) {
        queryId = new mongoose.Types.ObjectId(inv.patientId);
      }
      await userCollection.updateOne(
        { $or: [{ _id: queryId }, { _id: inv.patientId as any }] },
        { $set: { membership: "pro" } }
      );
    }

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

    // Check if upgrading to pro
    const hasProUpgrade = inv.items.some((item: any) => item.description === "Nâng cấp tài khoản Pro");
    if (hasProUpgrade) {
      const userCollection = mongoose.connection.collection("user");
      let queryId: any = inv.patientId;
      if (mongoose.Types.ObjectId.isValid(inv.patientId)) {
        queryId = new mongoose.Types.ObjectId(inv.patientId);
      }
      await userCollection.updateOne(
        { $or: [{ _id: queryId }, { _id: inv.patientId as any }] },
        { $set: { membership: "pro" } }
      );
    }

    await logActivity(
      (req as any).user.id,
      "Thanh toán VNPay QR",
      `Hóa đơn ${id} đã được thanh toán qua VNPay QR (mã: ${txnRef})`,
    );

    // ── Tạo notification "Thanh toán thành công" trong DB ──
    try {
      await Notification.create({
        user: inv.patientId,
        title: "Thanh toán thành công ✅",
        message: `Hóa đơn ${inv.totalAmount.toLocaleString("vi-VN")} VNĐ đã được thanh toán thành công (Mã GD: ${txnRef}).`,
        type: "invoice",
        link: "/patient/invoices",
      });
    } catch (notifyErr) {
      console.error("Failed to create payment notification:", notifyErr);
    }

    // ── Emit socket để cập nhật real-time ──
    try {
      const io = getIO();
      io.emit("payment_confirmed", {
        invoiceId: id,
        patientId: inv.patientId,
        txnRef,
        amount: inv.totalAmount,
      });
      // Cập nhật badge thông báo
      io.emit("notification_received");
    } catch (socketErr) {
      console.error("Socket emit error (non-critical):", socketErr);
    }

    // ── Gửi email xác nhận thanh toán ──
    try {
      // Lấy thông tin bệnh nhân (email, tên)
      const userCollection = mongoose.connection.collection("user");
      let queryId: any = inv.patientId;
      if (mongoose.Types.ObjectId.isValid(inv.patientId)) {
        queryId = new mongoose.Types.ObjectId(inv.patientId);
      }
      const patient = await userCollection.findOne(
        { $or: [{ _id: queryId }, { _id: inv.patientId as any }] },
        { projection: { email: 1, name: 1 } }
      );

      if (patient?.email) {
        const emailHtml = getPaymentConfirmationTemplate(
          patient.name || "Bệnh nhân",
          patient.email,
          id,
          txnRef,
          inv.totalAmount,
          new Date(),
          inv.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
          }))
        );
        await sendMail(
          patient.email,
          "✅ Xác nhận thanh toán hóa đơn y tế — MedFlow AI",
          emailHtml
        );
      }
    } catch (emailErr) {
      console.error("Failed to send payment confirmation email (non-critical):", emailErr);
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

export const addProUpgradeInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Look for pending invoice
    let inv = await invoice
      .findOne({ patientId: userId, status: { $in: ["draft", "pending_payment"] } })
      .sort({ createdAt: -1 });

    const proItem = {
      description: "Nâng cấp tài khoản Pro",
      quantity: 1,
      unitPrice: 500000,
      totalPrice: 500000,
      isEstimated: false,
    };

    if (!inv) {
      inv = new invoice({
        patientId: userId,
        status: "pending_payment",
        items: [proItem],
        totalAmount: proItem.totalPrice,
      });
      await inv.save();
    } else {
      const hasPro = inv.items.some((i: any) => i.description === proItem.description);
      if (!hasPro) {
        inv.items.push(proItem);
        inv.totalAmount = (inv.totalAmount || 0) + proItem.totalPrice;
        await inv.save();
      }
    }

    res.json({ message: "Đã thêm gói Pro vào hóa đơn", invoice: inv });
  } catch (error) {
    console.error("Error adding pro upgrade:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
