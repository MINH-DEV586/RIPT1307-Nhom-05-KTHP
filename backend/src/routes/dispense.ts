import express from "express";
import { checkRole } from "../middleware/checkRole";
import { 
  getAllPrescriptions, 
  getPrescriptionForDispensing, 
  confirmDispense 
} from "../controllers/dispense";

const router = express.Router();

router.get("/", checkRole(["pharmacist", "admin", "doctor"]), getAllPrescriptions);
router.get("/:prescriptionId", checkRole(["pharmacist", "admin", "doctor"]), getPrescriptionForDispensing);
router.post("/confirm", checkRole(["pharmacist", "admin", "doctor"]), confirmDispense);

export default router;
