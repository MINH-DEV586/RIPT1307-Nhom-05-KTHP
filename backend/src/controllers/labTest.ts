import type { Request, Response } from "express";
import LabTest from "../models/labTest";
import { logActivity } from "../lib/activity";



// GET /api/lab-tests
export const getLabTests = async (req: Request, res: Response) => {
  try {
    const tests = await LabTest.find({ isActive: true }).sort({ category: 1, name: 1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách xét nghiệm" });
  }
};

// POST /api/lab-tests
export const createLabTest = async (req: Request, res: Response) => {
  try {
    const existing = await LabTest.findOne({ name: req.body.name });
    if (existing) return res.status(400).json({ message: "Loại xét nghiệm này đã tồn tại" });
    const newTest = await LabTest.create(req.body);
    await logActivity((req as any).user.id, "Thêm loại xét nghiệm", `${newTest.name} - ${newTest.price.toLocaleString("vi-VN")}đ`);
    res.status(201).json(newTest);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm loại xét nghiệm" });
  }
};

// PUT /api/lab-tests/:id — cập nhật giá + thông tin
export const updateLabTest = async (req: Request, res: Response) => {
  try {
    const updated = await LabTest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Không tìm thấy loại xét nghiệm" });
    await logActivity((req as any).user.id, "Cập nhật xét nghiệm", `${updated.name} - Giá mới: ${updated.price.toLocaleString("vi-VN")}đ`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật loại xét nghiệm" });
  }
};

// DELETE /api/lab-tests/:id — xóa mềm
export const deleteLabTest = async (req: Request, res: Response) => {
  try {
    const test = await LabTest.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!test) return res.status(404).json({ message: "Không tìm thấy loại xét nghiệm" });
    await logActivity((req as any).user.id, "Xóa loại xét nghiệm", `${test.name}`);
    res.json({ message: "Đã xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa loại xét nghiệm" });
  }
};
