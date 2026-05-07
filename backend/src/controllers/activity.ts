import activityLog from "../models/activityLog";
import type { Request, Response } from "express";
import mongoose from "mongoose";

export const createActivityLog = async (req: Request, res: Response) => {
  try {
    const { userId, action, details } = req.body;
    const newLog = new activityLog({
      user: userId,
      action,
      details,
    });
    await newLog.save();
    res.status(201).json(newLog);
  } catch (error) {
    console.error("Error creating activity log:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const total = await activityLog.countDocuments();
    const collection = mongoose.connection.collection("user");

    const logs = await activityLog
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const logsWithUser = await Promise.all(
      logs.map(async (log) => {
        const user = await collection.findOne(
          { _id: new mongoose.Types.ObjectId(log.user) },
          { projection: { password: 0, emailVerified: 0 } },
        );
        return { ...log, user };
      }),
    );

    res.json({
      res: logsWithUser,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalData: total,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
