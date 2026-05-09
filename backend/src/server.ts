import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { serve } from "inngest/express";
import { createServer } from "http";

import { connectDB } from "./config/db";
import { auth } from "./lib/auth";
import userRouter from "./routes/user";
import activityLogRouter from "./routes/activity";
import { inngest } from "./inngest/client";
import {
  admitPatient,
  analyzeXRayJob,
  addChargeToInvoice,
} from "./inngest/functions";
import notificationRouter from "./routes/notification";
import labResultsRouter from "./routes/labResults";
import invoiceRouter from "./routes/invoice";
import { getIO, initSocket } from "./lib/socket";
import { uploadRouter } from "./lib/uploadthing";
import { createRouteHandler } from "uploadthing/express";
import uploadthingRouter from "./routes/uploadthing";
import dispenseRouter from "./routes/dispense";
import prescriptionRouter from "./routes/prescription";
import medicineRouter from "./routes/medicine";
import labRequestRouter from "./routes/labRequest";
import medicalRecordRouter from "./routes/medicalRecord";
import telemedicineRouter from "./routes/telemedicine";
import appointmentRouter from "./routes/appointment";
import bedRouter from "./routes/bed";

// Initialize Express application
const app: Application = express();
const PORT = process.env.PORT || 5001;
const httpServer = createServer(app);

initSocket(httpServer);
console.log("Environment check: MONGO_URI is", process.env.MONGO_URI ? "Defined" : "UNDEFINED");

// Make 'io' accessible in Express req.app.get("io") for backwards compatibility
app.set("io", getIO());

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Configure Helmet to allow cross-origin resource sharing
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Use cookie parser middleware to parse cookies in incoming requests
app.use(cookieParser());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware: skip noisy polling routes like get-session
if (process.env.NODE_ENV === "development") {
  app.use(
    morgan("dev", {
      skip: (req) =>
        req.url?.includes("/api/auth/get-session") ||
        req.url?.includes("/api/inngest"),
    }),
  );
}

// Basic route for testing
app.get("/", (req: Request, res: Response) => {
  res.send("Hello from the backend!");
});

app.all("/api/auth/*splat", toNodeHandler(auth));
app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return res.json(session);
});
app.use("/api/users", userRouter);
app.use("/api/activity-logs", activityLogRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/lab-results", labResultsRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/dispense", dispenseRouter);
app.use("/api/prescriptions", prescriptionRouter);
app.use("/api/medicines", medicineRouter);
app.use("/api/lab-requests", labRequestRouter);
app.use("/api/medical-records", medicalRecordRouter);
app.use("/api/telemedicine", telemedicineRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/beds", bedRouter);
// inngest API route
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [admitPatient, analyzeXRayJob, addChargeToInvoice],
  }),
);
app.use("/api/uploadthing", createRouteHandler({ router: uploadRouter }));
app.use("/api/uploadthing/delete", uploadthingRouter);

// --- Global Error Handler ---
app.use((err: any, req: Request, res: Response, next: any) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// Start the server
connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(
        `🚀 Server + Socket.IO running in ${process.env.NODE_ENV} mode on port ${PORT}`,
      );
    });
  })
  .catch((error) => {
    console.error(
      `Failed to connect to the database: ${(error as Error).message}`,
    );
  });
