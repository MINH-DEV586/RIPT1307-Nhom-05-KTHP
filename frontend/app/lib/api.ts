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
    credentials: "include", // Important for Better Auth cookies
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update user");
  }

  return res.json();
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
  data: { doctorNotes?: string; status?: string };
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

export const createLabResult = async (data: {
  patientId: string;
  testType: string;
  bodyPart: string;
  imageUrl: string;
  aiAnalysis?: string;
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

export const getMyActiveInvoice = async (patientId: string) => {
  const res = await fetch(`${API_URL}/invoices/my-active-invoice/${patientId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 404) return null; // No active invoice
    throw new Error("Failed to fetch invoice");
  }
  return res.json();
};

export const createCheckoutSession = async (invoiceId: string) => {
  const res = await fetch(`${API_URL}/invoices/${invoiceId}/checkout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to initiate checkout");
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
  const res = await fetch(`${API_URL}/invoices`, {
    credentials: "include",
    body: JSON.stringify(data),
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

export const getPrescriptions = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/dispense`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch prescriptions");
  return res.json();
};

export const getPrescriptionById = async (id: string): Promise<any> => {
  const res = await fetch(`${API_URL}/dispense/${id}`, {
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

export const getAllPrescriptionsList = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/prescriptions`, {
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

export const createMedicalRecord = async (data: any) => {
  const res = await fetch(`${API_URL}/medical-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create medical record");
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
