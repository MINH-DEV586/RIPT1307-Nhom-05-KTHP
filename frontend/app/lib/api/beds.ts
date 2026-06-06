import { API_URL } from "./config";

export const getAllBeds = async (params?: { department?: string; type?: string; status?: string }) => {
  const cleanParams = params ? Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null)) : {};
  const query = Object.keys(cleanParams).length > 0 ? `?${new URLSearchParams(cleanParams as any).toString()}` : "";
  const res = await fetch(`${API_URL}/beds${query}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch beds");
  return res.json();
};

export const admitPatientToBed = async (data: { patientId: string; bedId: string; admissionReason: string }) => {
  const res = await fetch(`${API_URL}/beds/admit`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to admit patient to bed");
  return res.json();
};

export const dischargePatientFromBed = async (patientId: string) => {
  const res = await fetch(`${API_URL}/beds/discharge/${patientId}`, {
    method: "POST", credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to discharge patient");
  return res.json();
};

export const createBed = async (data: any) => {
  const res = await fetch(`${API_URL}/beds`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create bed");
  return res.json();
};
