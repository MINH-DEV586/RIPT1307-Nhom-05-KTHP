import type { PaginatedResponse, ActivityLog } from "@/types";
import { API_URL } from "./config";

export const createActivityLog = async (data: { userId: string; action: string; details?: string; }) => {
  const res = await fetch(`${API_URL}/activity-logs/create`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create activity log");
  return res.json();
};

export const getActivityLogs = async (params: { page?: number; limit?: number; }): Promise<PaginatedResponse<ActivityLog>> => {
  const query = new URLSearchParams({ page: (params.page || 1).toString(), limit: (params.limit || 10).toString() }).toString();
  const res = await fetch(`${API_URL}/activity-logs?${query}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch activity logs");
  return res.json();
};
