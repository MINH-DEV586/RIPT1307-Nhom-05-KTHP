import mongoose from "mongoose";
import LabTest from "../models/labTest";
import { connectDB } from "../config/db";
import * as dotenv from "dotenv";

dotenv.config();

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

export const seedLabTests = async () => {
  await connectDB();
  try {
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
  } catch (error) {
    console.error("❌ Seeding lab tests failed:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedLabTests();
