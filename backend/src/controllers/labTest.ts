import type { Request, Response } from "express";
import LabTest from "../models/labTest";
import { logActivity } from "../lib/activity";

const DEFAULT_LAB_TESTS = [
  { name: "Xét nghiệm máu (CBC)", description: "Công thức máu toàn phần", price: 150000, category: "Huyết học", duration: "1 giờ" },
  { name: "Xét nghiệm nước tiểu", description: "Tổng phân tích nước tiểu", price: 80000, category: "Sinh hóa", duration: "30 phút" },
  { name: "Sinh hóa máu", description: "Xét nghiệm sinh hóa toàn diện", price: 200000, category: "Sinh hóa", duration: "2 giờ" },
  { name: "Chức năng gan (LFT)", description: "Kiểm tra chức năng gan", price: 250000, category: "Sinh hóa", duration: "2 giờ" },
  { name: "Chức năng thận (KFT)", description: "Kiểm tra chức năng thận", price: 220000, category: "Sinh hóa", duration: "2 giờ" },
  { name: "Đường huyết", description: "Xét nghiệm đường huyết lúc đói", price: 60000, category: "Sinh hóa", duration: "30 phút" },
  { name: "Siêu âm", description: "Siêu âm ổ bụng tổng quát", price: 250000, category: "Chẩn đoán hình ảnh", duration: "30 phút" },
  { name: "X-Quang", description: "Chụp X-quang ngực thẳng", price: 300000, category: "Chẩn đoán hình ảnh", duration: "30 phút" },
  { name: "CT Scan", description: "Chụp cắt lớp vi tính", price: 800000, category: "Chẩn đoán hình ảnh", duration: "1 giờ" },
  { name: "Xét nghiệm phân", description: "Phân tích phân tổng quát", price: 70000, category: "Vi sinh", duration: "1 giờ" },
];

/**
 * Gọi sau connectDB() — đảm bảo 10 loại XN mặc định luôn tồn tại.
 * - Nếu chưa có: tạo mới
 * - Nếu bị xóa (isActive=false): khôi phục lại
 * - Nếu đã có và admin đã sửa giá: GIỮ NGUYÊN giá (không ghi đè)
 */
export const seedLabTests = async () => {
  for (const test of DEFAULT_LAB_TESTS) {
    await LabTest.findOneAndUpdate(
      { name: test.name },
      {
        $setOnInsert: {
          price: test.price,
          description: test.description,
          category: test.category,
          duration: test.duration,
        },
        $set: { isActive: true }, // khôi phục nếu bị soft-delete
      },
      { upsert: true, new: true }
    );
  }
  console.log("✅ Đã đảm bảo 10 loại xét nghiệm mặc định trong DB");
};

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
