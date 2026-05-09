import express from "express";
import { requireAuth } from "../middleware/auth";
import { checkRole } from "../middleware/checkRole";
import { 
  createPrescription, 
  getPrescriptions, 
  getPrescriptionById,
  getMedicines
} from "../controllers/prescription";

const router = express.Router();

// ✅ requireAuth applied to all prescription routes
router.use(requireAuth);

router.get("/medicines", checkRole(["doctor", "admin", "pharmacist"]), getMedicines);
router.post("/", checkRole(["doctor", "admin"]), createPrescription);
router.get("/", checkRole(["doctor", "admin", "pharmacist", "nurse", "patient"]), getPrescriptions);
router.get("/:id", checkRole(["doctor", "admin", "pharmacist", "nurse", "patient"]), getPrescriptionById);

export default router;
