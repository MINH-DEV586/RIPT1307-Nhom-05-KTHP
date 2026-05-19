import express from "express";
import {
  createExamHistory,
  getPatientExamHistory,
  getExamHistoryById,
  getAllExamHistory,
} from "../controllers/examHistory";
import { requireAuth } from "../middleware/auth";
import { checkRole } from "../middleware/checkRole";

const router = express.Router();

router.use(requireAuth);

// Tạo lịch sử khám (Doctor/Admin)
router.post("/", checkRole(["admin", "doctor"]), createExamHistory);

// Lấy toàn bộ lịch sử (Doctor/Admin)
router.get("/", checkRole(["admin", "doctor"]), getAllExamHistory);

// Lấy lịch sử khám của một bệnh nhân (tất cả roles được xem)
router.get("/patient/:patientId", getPatientExamHistory);

// Lấy chi tiết một kết quả khám
router.get("/:id", getExamHistoryById);

export default router;
