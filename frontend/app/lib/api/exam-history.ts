import { API_URL } from "./config";

export const createExamHistory = async (data: {
  patient: string; symptoms: string; diagnosis: string; treatmentPlan: string;
  notes?: string; prescription?: string; labRequestIds?: string[];
  visitReason?: string; nextAppointment?: string;
}) => {
  const res = await fetch(`${API_URL}/exam-history`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create exam history");
  }
  return res.json();
};

export const getPatientExamHistory = async (patientId: string) => {
  const res = await fetch(`${API_URL}/exam-history/patient/${patientId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch exam history");
  return res.json();
};

export const getExamHistoryById = async (id: string) => {
  const res = await fetch(`${API_URL}/exam-history/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch exam history detail");
  return res.json();
};
