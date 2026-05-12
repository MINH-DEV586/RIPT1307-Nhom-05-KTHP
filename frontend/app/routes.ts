import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/Login.tsx"),
  route("register", "routes/Register.tsx"),
  route("*", "routes/not-found.tsx"),
  // you can use index or layout for nested routes
  layout("routes/protected/layout.tsx", [
    route("dashboard", "routes/protected/Dashboard.tsx"),
    route("admins", "routes/protected/Admins.tsx"),
    route("doctors", "routes/protected/Doctors.tsx"),
    route("nurses", "routes/protected/Nurses.tsx"),
    route("patients", "routes/protected/Patients.tsx"),
    route("activities-log", "routes/protected/ActivitiesLog.tsx"),
    route("profile/:id", "routes/protected/Profile.tsx"),
    route("financial-history", "routes/protected/FinancialHistory.tsx"),
    route("appointments", "routes/protected/Appointments.tsx"),
    route("appointments/book", "routes/protected/appointments/Book.tsx"),
    route("appointments/all-schedules", "routes/protected/appointments/AllSchedules.tsx"),
    route("appointments/schedule-setup", "routes/protected/appointments/ScheduleSetup.tsx"),
    route("bed-management", "routes/protected/BedManagement.tsx"),
    route("reports", "routes/protected/Reports.tsx"),
    route("pharmacy", "routes/protected/pharmacy/layout.tsx", [
      route("dispense", "routes/protected/pharmacy/DispenseList.tsx"),
      route("dispense/:id", "routes/protected/pharmacy/DispenseDetail.tsx"),
      route("prescriptions", "routes/protected/pharmacy/ManagePrescriptions.tsx"),
      route("prescriptions/create", "routes/protected/pharmacy/NewPrescription.tsx"),
      route("inventory", "routes/protected/pharmacy/MedicineInventory.tsx"),
    ]),
    route("lab", "routes/protected/lab/layout.tsx", [
      route("requests", "routes/protected/lab/ManageLabRequests.tsx"),
      route("requests/create", "routes/protected/lab/NewLabRequest.tsx"),
      route("requests/:id/enter-results", "routes/protected/lab/InputLabResults.tsx"),
      route("results", "routes/protected/lab/ManageLabResults.tsx"),
    ]),
    route("telemedicine", "routes/protected/telemedicine/ConsultLayout.tsx", [
      route("sessions", "routes/protected/telemedicine/SessionList.tsx"),
      route("sessions/book", "routes/protected/telemedicine/BookNewConsult.tsx"),
      route("sessions/:id/chat", "routes/protected/telemedicine/LiveChat.tsx"),
    ]),
    route("patient/medical-records", "routes/protected/patient/MedicalRecords.tsx"),
    route("patient/prescriptions", "routes/protected/patient/Prescriptions.tsx"),
    route("patient/test-results", "routes/protected/patient/TestResults.tsx"),
    route("patient/invoices", "routes/protected/patient/Invoices.tsx"),
  ]),
] satisfies RouteConfig;
