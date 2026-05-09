import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { checkRole } from "../middleware/checkRole";
import { 
  getAllBeds, 
  createBed, 
  updateBedStatus, 
  admitPatientToBed, 
  dischargePatientFromBed 
} from "../controllers/bed";

const bedRouter = Router();

bedRouter.get("/", requireAuth, getAllBeds);
bedRouter.post("/", requireAuth, checkRole(["admin", "doctor"]), createBed);
bedRouter.put("/:id/status", requireAuth, checkRole(["admin", "nurse"]), updateBedStatus);
bedRouter.post("/admit", requireAuth, checkRole(["admin", "doctor", "nurse"]), admitPatientToBed);
bedRouter.post("/discharge/:patientId", requireAuth, checkRole(["admin", "doctor", "nurse"]), dischargePatientFromBed);

export default bedRouter;
