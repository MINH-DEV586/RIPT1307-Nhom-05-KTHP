import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createCheckoutSession,
  getMyActiveInvoice,
  getBillingHistory,
  getAllInvoices,
} from "../controllers/invoice";
import { checkRole } from "../middleware/checkRole";

const invoiceRouter = Router();

// Routes for patients(if you want users like admin, doctors and nurses can have access to these route)(also you can combine "/my-active-invoice" and "/history" routes based on the status)
invoiceRouter.get(
  "/my-active-invoice/:patientId",
  requireAuth,
  checkRole(["patient", "admin", "doctor", "nurse"]),
  getMyActiveInvoice,
);
invoiceRouter.get("/", requireAuth, checkRole(["admin"]), getAllInvoices);
invoiceRouter.get("/history/:id", requireAuth, getBillingHistory);
invoiceRouter.post("/:id/checkout", requireAuth, createCheckoutSession);

export default invoiceRouter;
