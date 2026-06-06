import { API_URL } from "./config";

export const fetchNotifications = async () => {
  const res = await fetch(`${API_URL}/notifications`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
};

export const markAsRead = async (id: string) => {
  const res = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: "POST", credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to mark as read");
  return res.json();
};
