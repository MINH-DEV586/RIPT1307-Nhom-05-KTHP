import express from "express";
import { checkRole } from "../middleware/checkRole";
import { 
  getMedicines, 
  createMedicine, 
  updateMedicine, 
  deleteMedicine 
} from "../controllers/medicine";

const router = express.Router();

router.get("/", checkRole(["pharmacist", "admin", "doctor"]), getMedicines);
router.post("/", checkRole(["pharmacist", "admin", "doctor"]), createMedicine);
router.put("/:id", checkRole(["pharmacist", "admin", "doctor"]), updateMedicine);
router.delete("/:id", checkRole(["pharmacist", "admin", "doctor"]), deleteMedicine);

export default router;
