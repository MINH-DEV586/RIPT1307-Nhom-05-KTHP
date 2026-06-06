import type { invoice, PaginatedResponse } from "@/types";
import { API_URL } from "./config";

export const getMyActiveInvoice = async (patientId: string): Promise<{ invoices: any[]; patientIsAdmitted: boolean; } | null> => {
  const res = await fetch(`${API_URL}/invoices/my-active-invoice/${patientId}`, { credentials: "include" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch invoice");
  }
  const data = await res.json();
  if (Array.isArray(data)) return { invoices: data, patientIsAdmitted: false };
  return data;
};

export const createCheckoutSession = async (invoiceId: string) => {
  const res = await fetch(`${API_URL}/invoices/${invoiceId}/checkout`, {
    method: "POST", credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to initiate checkout");
  return res.json();
};

export const createVNPayCheckout = async (invoiceId: string): Promise<{ txnRef: string; qrContent: string; amount: number; invoiceId: string; }> => {
  const res = await fetch(`${API_URL}/invoices/${invoiceId}/vnpay-checkout`, {
    method: "POST", credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create VNPay QR");
  return res.json();
};

export const confirmVNPayPayment = async (invoiceId: string, txnRef: string): Promise<{ message: string; invoiceId: string; txnRef: string; }> => {
  const res = await fetch(`${API_URL}/invoices/${invoiceId}/confirm-payment`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txnRef }), credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to confirm payment");
  }
  return res.json();
};

export const getBillingHistory = async (userId: string) => {
  const res = await fetch(`${API_URL}/invoices/history/${userId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch billing history");
  return res.json();
};

export const getAllInvoices = async (data?: { page?: number; limit?: number; }): Promise<PaginatedResponse<invoice>> => {
  const query = data ? `?${new URLSearchParams(data as any).toString()}` : "";
  const res = await fetch(`${API_URL}/invoices${query}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
};

export const addProUpgradeInvoice = async () => {
  const res = await fetch(`${API_URL}/invoices/add-pro-upgrade`, {
    method: "POST", credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to add pro upgrade invoice");
  return res.json();
};
