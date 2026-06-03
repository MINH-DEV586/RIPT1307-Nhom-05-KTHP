import type {
  PaginatedResponse,
  Role,
  User,
  LabResult,
  WebPushSubscription,
  ActivityLog,
  invoice,
  appointment,
} from "@/types";

export const API_URL = "http://localhost:5001/api";

export const getUsers = async (params: {
  role: Role;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<User>> => {
  const query = new URLSearchParams({
    role: params.role,
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
  }).toString();

  const res = await fetch(`${API_URL}/users?${query}`, {
    credentials: "include", // Important for Better Auth cookies
  });

  if (!res.ok) throw new Error("Failed");

  return res.json();
};

export const triggerAdmission = async ({
  patientId,
  admissionReason,
}: {
  patientId: string;
  admissionReason: string;
}) => {
  // /:id/admit
  const res = await fetch(`${API_URL}/users/${patientId}/admit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admissionReason }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to start admission process");
  return res.json();
};

interface UpdateUserParams {
  userId: string;
  userData: Partial<User> & Record<string, any>; // Allow custom fields
}

// /update/:id
export const updateUser = async ({ userId, userData }: UpdateUserParams) => {
  const res = await fetch(`${API_URL}/users/update/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update user");
  }

  return res.json();
};

// Cập nhật trạng thái bệnh nhân (status)
export const updatePatientStatus = async (
  patientId: string,
  status: string
) => {
  return updateUser({ userId: patientId, userData: { status } as any });
};



export const createActivityLog = async (data: {
  userId: string;
  action: string;
  details?: string;
}) => {
  const res = await fetch(`${API_URL}/activity-logs/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Important for Better Auth cookies
  });
  if (!res.ok) throw new Error("Failed to create activity log");
  return res.json();
};

export const getPatientLabResults = async (
  patientId: string,
): Promise<LabResult[]> => {
  const res = await fetch(`${API_URL}/lab-results/patient/${patientId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch lab results");
  return res.json();
};

export const explainLabResult = async (id: string): Promise<{ explanation: string }> => {
  const res = await fetch(`${API_URL}/lab-results/${id}/explain`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("AI explanation failed");
  return res.json();
};

export const getAllLabResultsList = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/lab-results`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch lab results");
  return res.json();
};

export const updateLabResult = async ({
  id,
  data,
}: {
  id: string;
  data: any;
}) => {
  const res = await fetch(`${API_URL}/lab-results/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update lab result");
  return res.json();
};

export const deleteLabResult = async (id: string) => {
  const res = await fetch(`${API_URL}/lab-results/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete lab result");
  return res.json();
};

export const createLabResult = async (data: {
  patientId: string;
  testType: string;
  bodyPart?: string;
  imageUrl?: string;
  aiAnalysis?: string;
  labRequestId?: string;
  indicators?: any[];
  note?: string;
}) => {
  const res = await fetch(`${API_URL}/lab-results`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include", // Important for Better Auth cookies
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create lab result");
  }

  return res.json();
};

export const deleteFile = async ({ file }: { file: string }) => {
  const res = await fetch(`${API_URL}/uploadthing/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileUrl: file }),
    credentials: "include", // Important for Better Auth cookies
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete file");
  }

  return res.json();
};

export const getActivityLogs = async (params: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ActivityLog>> => {
  const query = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
  }).toString();

  const res = await fetch(`${API_URL}/activity-logs?${query}`, {
    credentials: "include", // Important for Better Auth cookies
  });

  if (!res.ok) throw new Error("Failed to fetch activity logs");

  return res.json();
};

export const getUserById = async (userId: string) => {
  const res = await fetch(`${API_URL}/users/profile/${userId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
};

export const getMyActiveInvoice = async (patientId: string): Promise<{
  invoices: any[];
  patientIsAdmitted: boolean;
} | null> => {
  const res = await fetch(`${API_URL}/invoices/my-active-invoice/${patientId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 404) return null; // No active invoice
    throw new Error("Failed to fetch invoice");
  }
  const data = await res.json();
  // Support both old array format and new object format
  if (Array.isArray(data)) {
    return { invoices: data, patientIsAdmitted: false };
  }
  return data;
};

export const createCheckoutSession = async (invoiceId: string) => {
  const res = await fetch(`${API_URL}/invoices/${invoiceId}/checkout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to initiate checkout");
  return res.json();
};

export const createVNPayCheckout = async (invoiceId: string): Promise<{
  txnRef: string;
  qrContent: string;
  amount: number;
  invoiceId: string;
}> => {
  const res = await fetch(`${API_URL}/invoices/${invoiceId}/vnpay-checkout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create VNPay QR");
  return res.json();
};

export const confirmVNPayPayment = async (invoiceId: string, txnRef: string): Promise<{
  message: string;
  invoiceId: string;
  txnRef: string;
}> => {
  const res = await fetch(`${API_URL}/invoices/${invoiceId}/confirm-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txnRef }),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to confirm payment");
  }
  return res.json();
};

export const getBillingHistory = async (userId: string) => {
  const res = await fetch(`${API_URL}/invoices/history/${userId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch billing history");
  return res.json();
};

export const getAllInvoices = async (data?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<invoice>> => {
  const query = data ? `?${new URLSearchParams(data as any).toString()}` : "";
  const res = await fetch(`${API_URL}/invoices${query}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
};


export const fetchNotifications = async () => {
  const res = await fetch(`${API_URL}/notifications`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json(); // Expected response: { notifications:[], unreadCount: 0 }
};

export const markAsRead = async (id: string) => {
  const res = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to mark as read");
  return res.json();
};

export const getAppointmentById = async (id: string) => {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "Failed to fetch appointment details");
  }
  return res.json();
};

export const getPrescriptions = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/dispense`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch prescriptions");
  return res.json();
};

export const getPrescriptionById = async (id: string): Promise<any> => {
  const res = await fetch(`${API_URL}/prescriptions/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch prescription");
  return res.json();
};


export const confirmDispense = async (prescriptionId: string): Promise<any> => {
  const res = await fetch(`${API_URL}/dispense/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prescriptionId }),
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to confirm dispense");
  }
  return res.json();
};

export const getAvailableMedicines = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/prescriptions/medicines`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch medicines");
  return res.json();
};

export const createPrescription = async (data: any): Promise<any> => {
  const res = await fetch(`${API_URL}/prescriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create prescription");
  }
  return res.json();
};

export const getAllPrescriptionsList = async (params?: { patientId?: string; doctorId?: string }): Promise<any[]> => {
  const query = params ? `?${new URLSearchParams(params as any).toString()}` : "";
  const res = await fetch(`${API_URL}/prescriptions${query}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch prescriptions");
  return res.json();
};

export const getAllMedicines = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/medicines`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch medicines");
  return res.json();
};

export const createMedicineRecord = async (data: any): Promise<any> => {
  const res = await fetch(`${API_URL}/medicines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create medicine");
  return res.json();
};

export const updateMedicineRecord = async (id: string, data: any): Promise<any> => {
  const res = await fetch(`${API_URL}/medicines/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update medicine");
  return res.json();
};

export const deleteMedicineRecord = async (id: string): Promise<any> => {
  const res = await fetch(`${API_URL}/medicines/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete medicine");
  return res.json();
};

export const importMedicinesBulk = async (medicinesData: any[]): Promise<any> => {
  const res = await fetch(`${API_URL}/medicines/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(medicinesData),
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to import medicines");
  }
  return res.json();
};

export const createLabRequest = async (data: any): Promise<any> => {
  const res = await fetch(`${API_URL}/lab-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create lab request");
  return res.json();
};

export const getLabRequestsList = async (params?: { patientId?: string; status?: string }): Promise<any[]> => {
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_URL}/lab-requests?${query}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch lab requests");
  return res.json();
};

export const getLabRequestById = async (id: string): Promise<any> => {
  const res = await fetch(`${API_URL}/lab-requests/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch lab request");
  return res.json();
};

export const updateLabRequestStatus = async (id: string, status: string): Promise<any> => {
  const res = await fetch(`${API_URL}/lab-requests/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
};

export const createTelemedicineSession = async (data: any): Promise<any> => {
  const res = await fetch(`${API_URL}/telemedicine/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to book consultation");
  return res.json();
};

export const getTelemedicineSessions = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/telemedicine/sessions`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
};

export const getChatHistory = async (sessionId: string): Promise<any[]> => {
  const res = await fetch(`${API_URL}/telemedicine/sessions/${sessionId}/chat`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch chat history");
  return res.json();
};

export const updateSessionStatus = async (id: string, status: string): Promise<any> => {
  const res = await fetch(`${API_URL}/telemedicine/sessions/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update session status");
  return res.json();
};

export const deleteTelemedicineSession = async (id: string): Promise<any> => {
  const res = await fetch(`${API_URL}/telemedicine/sessions/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete session");
  return res.json();
};

export const createUser = async (data: any): Promise<any> => {
  const res = await fetch(`${API_URL}/users/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create user");
  }
  return res.json();
};




export const getPatientMedicalRecords = async (patientId: string) => {
  const res = await fetch(`${API_URL}/medical-records/patient/${patientId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch medical records");
  return res.json();
};

export const getMedicalRecordById = async (id: string) => {
  const res = await fetch(`${API_URL}/medical-records/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch medical record");
  return res.json();
};

export const updateMedicalRecord = async (id: string, data: {
  symptoms?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
  admissionReason?: string;
}) => {
  const res = await fetch(`${API_URL}/medical-records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update medical record");
  }
  return res.json();
};

export const deleteMedicalRecord = async (id: string) => {
  const res = await fetch(`${API_URL}/medical-records/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete medical record");
  }
  return res.json();
};

export const createMedicalRecord = async (data: any) => {
  const res = await fetch(`${API_URL}/medical-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create medical record");
  }
  return res.json();
};



export const getAvailableDoctors = async (params?: { specialization?: string; feeMax?: number }) => {
  const filteredParams = params ? Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined)) : {};
  const query = Object.keys(filteredParams).length > 0 ? `?${new URLSearchParams(filteredParams as any).toString()}` : "";
  const res = await fetch(`${API_URL}/appointments/doctors${query}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch doctors");
  return res.json();
};

export const bookAppointment = async (data: any) => {
  const res = await fetch(`${API_URL}/appointments/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to book appointment");
  return res.json();
};

export const getMyAppointments = async (params?: { status?: string }) => {
  const query = params ? `?${new URLSearchParams(params as any).toString()}` : "";
  const res = await fetch(`${API_URL}/appointments/my${query}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch appointments");
  return res.json();
};

export const getDoctorAppointments = async (params?: { status?: string; date?: string }) => {
  const query = params ? `?${new URLSearchParams(params as any).toString()}` : "";
  const res = await fetch(`${API_URL}/appointments/doctor-list${query}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch doctor appointments");
  return res.json();
};

export const updateAppointmentStatus = async (id: string, data: { status: string; meetingLink?: string; billing?: any; rejectionReason?: string }) => {
  const res = await fetch(`${API_URL}/appointments/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update appointment status");
  return res.json();
};

export const createWalkInAppointment = async (patientId: string) => {
  const res = await fetch(`${API_URL}/appointments/walk-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientId }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create walk-in appointment");
  return res.json();
};

export const updateDoctorSchedule = async (data: any) => {
  const res = await fetch(`${API_URL}/appointments/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update schedule");
  return res.json();
};

export const getDoctorSchedule = async (doctorId: string) => {
  const res = await fetch(`${API_URL}/appointments/schedule/${doctorId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch schedule");
  return res.json();
};

export const getAllDoctorSchedules = async () => {
  const res = await fetch(`${API_URL}/appointments/schedule/all`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch all schedules");
  return res.json();
};

export const getAvailableSlots = async (doctorId: string, date: string) => {
  const res = await fetch(`${API_URL}/appointments/available-slots/${doctorId}?date=${date}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch available slots");
  return res.json();
};

// --- BED MANAGEMENT SYSTEM ---

export const getAllBeds = async (params?: { department?: string; type?: string; status?: string }) => {
  const cleanParams = params ? Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null)) : {};
  const query = Object.keys(cleanParams).length > 0 ? `?${new URLSearchParams(cleanParams as any).toString()}` : "";
  const res = await fetch(`${API_URL}/beds${query}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch beds");
  return res.json();
};

export const admitPatientToBed = async (data: { patientId: string; bedId: string; admissionReason: string }) => {
  const res = await fetch(`${API_URL}/beds/admit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to admit patient to bed");
  return res.json();
};

export const dischargePatientFromBed = async (patientId: string) => {
  const res = await fetch(`${API_URL}/beds/discharge/${patientId}`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to discharge patient");
  return res.json();
};

export const createBed = async (data: any) => {
  const res = await fetch(`${API_URL}/beds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create bed");
  return res.json();
};

// --- EXAM HISTORY (Outpatient) ---

export const createExamHistory = async (data: {
  patient: string;
  symptoms: string;
  diagnosis: string;
  treatmentPlan: string;
  notes?: string;
  prescription?: string;   // ID đơn thuốc (singular, khớp với backend schema)
  labRequestIds?: string[];
  visitReason?: string;
  nextAppointment?: string;
}) => {
  const res = await fetch(`${API_URL}/exam-history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create exam history");
  }
  return res.json();
};


export const getPatientExamHistory = async (patientId: string) => {
  const res = await fetch(`${API_URL}/exam-history/patient/${patientId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch exam history");
  return res.json();
};

export const getExamHistoryById = async (id: string) => {
  const res = await fetch(`${API_URL}/exam-history/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch exam history detail");
  return res.json();
};

// ===== LAB TESTS (Bảng giá xét nghiệm) =====

export const getLabTests = async () => {
  const res = await fetch(`${API_URL}/lab-tests`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch lab tests");
  return res.json();
};

export const createLabTestRecord = async (data: {
  name: string;
  description?: string;
  price: number;
  category?: string;
  duration?: string;
}) => {
  const res = await fetch(`${API_URL}/lab-tests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create lab test");
  }
  return res.json();
};

export const updateLabTestRecord = async (id: string, data: Partial<{
  name: string;
  description: string;
  price: number;
  category: string;
  duration: string;
}>) => {
  const res = await fetch(`${API_URL}/lab-tests/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update lab test");
  return res.json();
};

export const deleteLabTestRecord = async (id: string) => {
  const res = await fetch(`${API_URL}/lab-tests/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete lab test");
  return res.json();
};
