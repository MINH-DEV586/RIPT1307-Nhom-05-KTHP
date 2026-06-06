import { API_URL } from "./config";

export const getPatientMedicalRecords = async (patientId: string) => {
  const res = await fetch(`${API_URL}/medical-records/patient/${patientId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch medical records");
  return res.json();
};

export const getMedicalRecordById = async (id: string) => {
  const res = await fetch(`${API_URL}/medical-records/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch medical record");
  return res.json();
};

export const updateMedicalRecord = async (id: string, data: {
  symptoms?: string; diagnosis?: string; treatmentPlan?: string; notes?: string; admissionReason?: string;
}) => {
  const res = await fetch(`${API_URL}/medical-records/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update medical record");
  }
  return res.json();
};

export const deleteMedicalRecord = async (id: string) => {
  const res = await fetch(`${API_URL}/medical-records/${id}`, {
    method: "DELETE", credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete medical record");
  }
  return res.json();
};

export const createMedicalRecord = async (data: any) => {
  const res = await fetch(`${API_URL}/medical-records`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create medical record");
  }
  return res.json();
};
