import type { PaginatedResponse, Role, User } from "@/types";
import { API_URL } from "./config";

export const getUsers = async (params: { role: Role; page?: number; limit?: number; }): Promise<PaginatedResponse<User>> => {
  const query = new URLSearchParams({ role: params.role, page: (params.page || 1).toString(), limit: (params.limit || 10).toString() }).toString();
  const res = await fetch(`${API_URL}/users?${query}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed");
  return res.json();
};

export const triggerAdmission = async ({ patientId, admissionReason }: { patientId: string; admissionReason: string }) => {
  const res = await fetch(`${API_URL}/users/${patientId}/admit`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admissionReason }), credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to start admission process");
  return res.json();
};

export const updateUser = async ({ userId, userData }: { userId: string; userData: Partial<User> & Record<string, any>; }) => {
  const res = await fetch(`${API_URL}/users/update/${userId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData), credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update user");
  }
  return res.json();
};

export const updatePatientStatus = async (patientId: string, status: string) => {
  return updateUser({ userId: patientId, userData: { status } as any });
};

export const getUserById = async (userId: string) => {
  const res = await fetch(`${API_URL}/users/profile/${userId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
};

export const createUser = async (data: any): Promise<any> => {
  const res = await fetch(`${API_URL}/users/create`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create user");
  }
  return res.json();
};
