import { API_URL } from "./config";

export const createTelemedicineSession = async (data: any): Promise<any> => {
  const res = await fetch(`${API_URL}/telemedicine/sessions`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to book consultation");
  return res.json();
};

export const getTelemedicineSessions = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/telemedicine/sessions`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
};

export const getChatHistory = async (sessionId: string): Promise<any[]> => {
  const res = await fetch(`${API_URL}/telemedicine/sessions/${sessionId}/chat`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch chat history");
  return res.json();
};

export const updateSessionStatus = async (id: string, status: string): Promise<any> => {
  const res = await fetch(`${API_URL}/telemedicine/sessions/${id}/status`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }), credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update session status");
  return res.json();
};

export const deleteTelemedicineSession = async (id: string): Promise<any> => {
  const res = await fetch(`${API_URL}/telemedicine/sessions/${id}`, {
    method: "DELETE", credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete session");
  return res.json();
};
