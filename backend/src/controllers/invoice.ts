import invoice from "../models/invoice";
import Bed from "../models/bed";
import type { Request, Response } from "express";
import { logActivity } from "../lib/activity";
import mongoose from "mongoose";

export const getMyActiveInvoice = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
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

        // If no active invoice exists in the DB, mock a draft one so we can show the bed fee
        let responseInvoice: any;
        if (!inv) {
          responseInvoice = {
            _id: "temp-bed-invoice",
            patientId,
            status: "draft",
            items: [{
              description: `Phí giường bệnh nội trú (Tạm tính - ${bedTypeLabel} - ${days} ngày)`,
              quantity: 1,
              unitPrice: totalFee,
              totalPrice: totalFee,
              isEstimated: true
            }],
            totalAmount: totalFee,
            createdAt: admittedAt,
            updatedAt: new Date(),
            isEstimatedInvoice: true
          };
        } else {
          // If invoice exists, clone items and append the estimated bed item
          const updatedItems = [...inv.items];
          // Check if a permanent bed item already exists (though it shouldn't until discharge)
          const bedItemIndex = updatedItems.findIndex(item => item.description.startsWith("Phí giường bệnh nội trú"));
          
          if (bedItemIndex > -1) {
            // Replace with updated stay calculation
            updatedItems[bedItemIndex] = {
              description: `Phí giường bệnh nội trú (Tạm tính - ${bedTypeLabel} - ${days} ngày)`,
              quantity: 1,
              unitPrice: totalFee,
              totalPrice: totalFee
            };
          } else {
            updatedItems.push({
              description: `Phí giường bệnh nội trú (Tạm tính - ${bedTypeLabel} - ${days} ngày)`,
              quantity: 1,
              unitPrice: totalFee,
              totalPrice: totalFee
            });
          }

          const extraFee = bedItemIndex > -1 ? (totalFee - inv.items[bedItemIndex].totalPrice) : totalFee;

          responseInvoice = {
            ...inv.toObject(),
            items: updatedItems,
            totalAmount: inv.totalAmount + extraFee,
            isEstimatedInvoice: true
          };
        }

        return res.json(responseInvoice);
      }
    }

    if (!inv) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn đang hoạt động" });
    }
    res.json(inv);
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
