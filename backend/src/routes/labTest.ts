import express from "express";
import { checkRole } from "../middleware/checkRole";
import { getLabTests, createLabTest, updateLabTest, deleteLabTest } from "../controllers/labTest";

const router = express.Router();

// GET: tất cả roles có thể xem danh sách + giá
router.get("/", checkRole(["admin", "doctor", "lab_tech", "patient"]), getLabTests);
// POST/PUT/DELETE: chỉ admin
router.post("/", checkRole(["admin"]), createLabTest);
router.put("/:id", checkRole(["admin"]), updateLabTest);
router.delete("/:id", checkRole(["admin"]), deleteLabTest);

export default router;
