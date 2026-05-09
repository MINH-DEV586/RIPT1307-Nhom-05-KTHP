import invoice from "../models/invoice";
import type { Request, Response } from "express";
import { logActivity } from "../lib/activity";
import mongoose from "mongoose";

export const getMyActiveInvoice = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const inv = await invoice
      .findOne({ patientId, status: { $in: ["draft", "pending_payment"] } })
      .sort({ createdAt: -1 });

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
