import mongoose from "mongoose";
import type { Request, Response } from "express";
import { logActivity } from "../lib/activity";
import { inngest } from "../inngest/client";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, ...additionalFields } = req.body;

    // 1. Create user without the 'role' field first (Better-Auth restriction)
    const newUser = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        ...additionalFields,
      },
    });

    if (!newUser) {
      return res.status(400).json({ message: "Không thể tạo người dùng" });
    }

    // 2. Immediately update the role directly in the database
    if (role) {
      const collection = mongoose.connection.collection("user");
      await collection.updateOne(
        { email: email },
        { $set: { role: role } }
      );
    }

    await logActivity(
      (req as any).user.id,
      "Tạo người dùng mới",
      `Đã tạo ${role || "patient"}: ${name} (${email})`
    );

    res.status(201).json({
      message: "Tạo người dùng thành công",
      user: { ...newUser.user, role: role || "patient" },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    res.status(500).json({ 
      message: error.message || "Lỗi hệ thống khi tạo người dùng" 
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    if (currentUser.id?.toString() !== id?.toString() && currentUser.role === "patient") {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const queryId =
      id?.length === 24 ? new mongoose.Types.ObjectId(id as string) : id;
    const collection = mongoose.connection.collection("user");
    const user = await collection.findOne(
      { _id: queryId as mongoose.Types.ObjectId },
      { projection: { password: 0 } },
    );

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    let { name, email, role, password, ...customFields } = req.body;

    // Security check: Patients can only update their own profile
    if (currentUser.role === "patient") {
      // Compare as strings to handle both ObjectId and string ID formats
      if (currentUser.id?.toString() !== id?.toString()) {
        return res.status(403).json({ message: "Bạn không có quyền cập nhật hồ sơ của người khác" });
      }
      // Patients can ONLY update name, email, birthday, phoneNumber, address, insuranceId, and image (avatar)
      role = undefined;
      password = undefined;
      customFields = { 
        birthday: customFields.birthday, 
        phoneNumber: customFields.phoneNumber, 
        address: customFields.address, 
        insuranceId: customFields.insuranceId,
        image: customFields.image,
      }; 
    }

    const queryId =
      id?.length === 24 ? new mongoose.Types.ObjectId(id as string) : id;
    const collection = mongoose.connection.collection("user");

    const existingUser = await collection.findOne({
      _id: queryId as mongoose.Types.ObjectId,
    });
    if (!existingUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Security check: Doctors cannot update other doctors
    if (currentUser.role === "doctor" && existingUser.role === "doctor" && currentUser.id?.toString() !== id?.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật hồ sơ của bác sĩ khác" });
    }

    const updatePayload: any = {
      name,
      email,
      role,
      ...customFields,
    };

    Object.keys(updatePayload).forEach(
      (key) =>
        (updatePayload[key] === undefined || updatePayload[key] === null) &&
        delete updatePayload[key],
    );

    const result = await collection.updateOne(
      { _id: queryId as mongoose.Types.ObjectId },
      { $set: updatePayload },
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    
    const io = req.app.get("io");
    if (io && result.modifiedCount > 0) {
      io.emit("notify_user_updated");
    }

    await logActivity(
      currentUser.id,
      "Cập nhật hồ sơ",
      `Đã cập nhật thông tin cho người dùng: ${id}`
    );
    
    res.json({
      message: "Cập nhật thành công",
      updatedUser: result,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const fetchAllUsers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;
    const filter: any = {};
    const currentUser = (req as any).user;
    const role = req.query.role as string;

    if (role && role !== "all" && role !== "") {
      filter.role = role;
    }

    // Privacy check: Patients should only be allowed to fetch doctor lists (for consultations)
    if (currentUser.role === "patient") {
      filter.role = "doctor"; // Force patient to only see doctors
    }

    const collection = mongoose.connection.collection("user");
    const totalUsers = await collection.countDocuments(filter);
    const users = await collection
      .find(
        filter,
        {
          projection: {
            password: 0,
            headers: 0,
            emailVerified: 0,
          },
        },
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    res.json({
      res: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalData: totalUsers,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const admitPatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { admissionReason } = req.body;

    await inngest.send({
      name: "patient/admitted",
      data: { patientId: id, admissionReason },
    });
    await logActivity(
      (req as any).user.id,
      "Cho bệnh nhân nhập viện",
      `Đã cho bệnh nhân ${id} nhập viện`,
    );
    res.json({ message: "Yêu cầu nhập viện đã được gửi thành công" });
  } catch (error) {
    console.error("Error admitting patient:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getPolarPortalLink = async (req: Request, res: Response) => {
  res.status(404).json({ message: "Cổng thanh toán chưa được cấu hình" });
};
