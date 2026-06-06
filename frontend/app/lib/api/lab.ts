import type { LabResult } from "@/types";
import { API_URL } from "./config";

export const getPatientLabResults = async (patientId: string): Promise<LabResult[]> => {
  const res = await fetch(`${API_URL}/lab-results/patient/${patientId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch lab results");
  return res.json();
};

export const explainLabResult = async (id: string): Promise<{ explanation: string }> => {
  const res = await fetch(`${API_URL}/lab-results/${id}/explain`, { credentials: "include" });
  if (!res.ok) throw new Error("AI explanation failed");
  return res.json();
};

export const getAllLabResultsList = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/lab-results`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch lab results");
  return res.json();
};

export const updateLabResult = async ({ id, data }: { id: string; data: any; }) => {
  const res = await fetch(`${API_URL}/lab-results/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update lab result");
  return res.json();
};

export const deleteLabResult = async (id: string) => {
  const res = await fetch(`${API_URL}/lab-results/${id}`, {
    method: "DELETE", credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete lab result");
  return res.json();
};

export const createLabResult = async (data: any) => {
  const res = await fetch(`${API_URL}/lab-results`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create lab result");
  }
  return res.json();
};

export const createLabRequest = async (data: any): Promise<any> => {
  const res = await fetch(`${API_URL}/lab-requests`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create lab request");
  return res.json();
};

export const getLabRequestsList = async (params?: { patientId?: string; status?: string }): Promise<any[]> => {
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_URL}/lab-requests?${query}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch lab requests");
  return res.json();
};

export const getLabRequestById = async (id: string): Promise<any> => {
  const res = await fetch(`${API_URL}/lab-requests/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch lab request");
  return res.json();
};

export const updateLabRequestStatus = async (id: string, status: string): Promise<any> => {
  const res = await fetch(`${API_URL}/lab-requests/${id}/status`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }), credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
};

export const getLabTests = async () => {
  const res = await fetch(`${API_URL}/lab-tests`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch lab tests");
  return res.json();
};

export const createLabTestRecord = async (data: any) => {
  const res = await fetch(`${API_URL}/lab-tests`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    credentials: "include", body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create lab test");
  }
  return res.json();
};

export const updateLabTestRecord = async (id: string, data: any) => {
  const res = await fetch(`${API_URL}/lab-tests/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    credentials: "include", body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update lab test");
  return res.json();
};

export const deleteLabTestRecord = async (id: string) => {
  const res = await fetch(`${API_URL}/lab-tests/${id}`, {
    method: "DELETE", credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete lab test");
  return res.json();
};
