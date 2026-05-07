import express from "express";
import { checkRole } from "../middleware/checkRole";
import { 
  createPrescription, 
  getPrescriptions, 
  getPrescriptionById,
  getMedicines
} from "../controllers/prescription";

const router = express.Router();

router.get("/medicines", checkRole(["doctor", "admin", "pharmacist"]), getMedicines);
router.post("/", checkRole(["doctor", "admin"]), createPrescription);
router.get("/", checkRole(["doctor", "admin", "pharmacist", "nurse"]), getPrescriptions);
router.get("/:id", checkRole(["doctor", "admin", "pharmacist", "nurse"]), getPrescriptionById);

export default router;
