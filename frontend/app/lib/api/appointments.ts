import { API_URL } from "./config";

export const getAppointmentById = async (id: string) => {
  const res = await fetch(`${API_URL}/appointments/${id}`, { credentials: "include" });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "Failed to fetch appointment details");
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
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
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
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update appointment status");
  return res.json();
};

export const createWalkInAppointment = async (patientId: string) => {
  const res = await fetch(`${API_URL}/appointments/walk-in`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientId }), credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create walk-in appointment");
  return res.json();
};

export const updateDoctorSchedule = async (data: any) => {
  const res = await fetch(`${API_URL}/appointments/schedule`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
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
