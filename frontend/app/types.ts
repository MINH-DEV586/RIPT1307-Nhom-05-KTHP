export type Role =
  | "all"
  | "admin"
  | "doctor"
  | "nurse"
  | "pharmacist"
  | "lab_tech"
  | "patient";
// src/types/index.ts

// --- 1. PATIENT STATUSES ---
// Clinical states for patients
export type PatientStatus =
  | "admitted"
  | "in_treatment"
  | "observation"
  | "discharged"
  | "follow_up"
  | "deceased"; // Optional, but common in HMS

// --- 2. STAFF STATUSES ---
// Employment/Availability states for Doctors, Nurses, etc.
export type StaffStatus = "active" | "on_leave" | "suspended" | "resigned";

// --- 3. COMBINED USER STATUS ---
// The actual type used in the generic User interface
export type UserStatus = PatientStatus | StaffStatus;

export interface LabResult {
  _id: string;
  patientId: string;
  testType: string;
  bodyPart: string;
  imageUrl: string;
  aiAnalysis: string;
  status: "pending" | "analyzed" | "reviewed";
  doctorNotes: string;
  createdAt: string;
}

export interface User {
  _id: string; // MongoDB uses _id. Change to 'id' if you transform it on backend.
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  status: UserStatus;
  banned: boolean; // For staff, indicates if they are banned from the system
  specialization?: string;
  gender?: string;
  bloodgroup?: string;
  medicalHistory?: string;
  department?: string;
  labResults?: LabResult[];
  prescriptions?: string[];
  appointmentsXRay?: string[];
  assignedDoctorId?: string | null;
  assignedNurseId?: string | null;
  triageReasoning?: string;
  assignedDoctorName?: string;
  assignedNurseName?: string;
  membership?: "standard" | "pro";
  assignedBedId?: string;
  patientType?: "inpatient" | "outpatient";
  birthday?: string;
  phoneNumber?: string;
  address?: string;
  insuranceId?: string;
}

export interface Bed {
  _id: string;
  bedNumber: string;
  type: "normal" | "emergency" | "rehab" | "disability" | "vip";
  status: "available" | "occupied" | "maintenance";
  patientId?: string;
  department: string;
  floor: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  res: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalData: number;
    limit: number;
  };
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "system" | "assignment" | "lab_result" | "alert";
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface WebPushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface ActivityLog {
  _id: string;
  user: User; // Who did it?
  action: string; // "Created Exam", "Registered Student"
  details?: string;
  createdAt: Date;
}

export interface invoice {
  _id: string;
  user: User;
  polarCheckoutId?: string; // Links to Polar transaction
  status: "draft" | "pending_payment" | "paid";
  items: Array<{
    description: string; // e.g., "Chest X-Ray"
    quantity: number;
    unitPrice: number; // in cents (Polar uses cents)
    totalPrice: number;
  }>;
  totalAmount: number; // Sum of all items in cents
  createdAt: Date;
}

export interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string;
  patientType: "self" | "family";
  patientName?: string;
  date: string;
  timeSlot: string;
  type: "online" | "offline";
  symptoms: string;
  notes?: string;
  files?: string[];
  status: "pending" | "confirmed" | "cancelled" | "completed";
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
  doctor?: User;
  patient?: User;
}

export interface DoctorSchedule {
  _id: string;
  doctorId: string;
  workingDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  breakTime: {
    start: string;
    end: string;
  };
  maxPatientsPerDay: number;
  slotDuration: number;
}

export interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
}

export interface Prescription {
  _id: string;
  patientId: string;
  doctorId: string;
  patientName?: string;
  diagnosis: string;
  items: PrescriptionItem[];
  status: "pending" | "dispensed" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patient?: User;
  doctor?: User;
}

export interface Dispense {
  _id: string;
  prescriptionId: string;
  dispensedBy: string;
  dispensedAt: string;
  items: {
    medicineId: string;
    medicineName: string;
    quantity: number;
  }[];
}

export interface MedicalRecord {
  _id: string;
  patient: User | string;
  doctor: User | string;
  date: string;
  symptoms: string;
  diagnosis: string;
  treatmentPlan: string;
  notes?: string;
  attachments?: string[];
  createdAt: string;
}
