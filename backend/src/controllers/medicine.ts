import type { Request, Response } from "express";
import Medicine from "../models/medicine";
import { logActivity } from "../lib/activity";

export const getMedicines = async (req: Request, res: Response) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.json(medicines);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách thuốc" });
  }
};

export const createMedicine = async (req: Request, res: Response) => {
  try {
    const medicineData = req.body;
    const newMedicine = new Medicine(medicineData);
    await newMedicine.save();

    await logActivity(
      (req as any).user.id,
      "Thêm thuốc mới",
      `Đã thêm thuốc: ${newMedicine.name}`
    );

    res.status(201).json(newMedicine);
  } catch (error) {
    console.error("Error creating medicine:", error);
    res.status(500).json({ message: "Lỗi khi thêm thuốc" });
  }
};

export const updateMedicine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedMedicine = await Medicine.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!updatedMedicine) return res.status(404).json({ message: "Không tìm thấy thuốc" });

    await logActivity(
      (req as any).user.id,
      "Cập nhật thuốc",
      `Đã cập nhật thông tin thuốc: ${updatedMedicine.name}`
    );

    res.json(updatedMedicine);
  } catch (error) {
    console.error("Error updating medicine:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật thuốc" });
  }
};

export const deleteMedicine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findByIdAndDelete(id);
    
    if (!medicine) return res.status(404).json({ message: "Không tìm thấy thuốc" });

    await logActivity(
      (req as any).user.id,
      "Xóa thuốc",
      `Đã xóa thuốc: ${medicine.name}`
    );

    res.json({ message: "Đã xóa thuốc thành công" });
  } catch (error) {
    console.error("Error deleting medicine:", error);
    res.status(500).json({ message: "Lỗi khi xóa thuốc" });
  }
};
