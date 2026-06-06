import { API_URL } from "./config";

export const getPrescriptions = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/dispense`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch prescriptions");
  return res.json();
};

export const getPrescriptionById = async (id: string): Promise<any> => {
  const res = await fetch(`${API_URL}/prescriptions/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch prescription");
  return res.json();
};

export const confirmDispense = async (prescriptionId: string): Promise<any> => {
  const res = await fetch(`${API_URL}/dispense/confirm`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prescriptionId }), credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to confirm dispense");
  }
  return res.json();
};

export const getAvailableMedicines = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/prescriptions/medicines`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch medicines");
  return res.json();
};

export const createPrescription = async (data: any): Promise<any> => {
  const res = await fetch(`${API_URL}/prescriptions`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create prescription");
  }
  return res.json();
};

export const getAllPrescriptionsList = async (params?: { patientId?: string; doctorId?: string }): Promise<any[]> => {
  const query = params ? `?${newSearchParams(params)}` : "";
  const res = await fetch(`${API_URL}/prescriptions${query}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch prescriptions");
  return res.json();
};

function newSearchParams(params: any): string {
  return new URLSearchParams(params as any).toString();
}

export const getAllMedicines = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/medicines`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch medicines");
  return res.json();
};

export const createMedicineRecord = async (data: any): Promise<any> => {
  const res = await fetch(`${API_URL}/medicines`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create medicine");
  return res.json();
};

export const updateMedicineRecord = async (id: string, data: any): Promise<any> => {
  const res = await fetch(`${API_URL}/medicines/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update medicine");
  return res.json();
};

export const deleteMedicineRecord = async (id: string): Promise<any> => {
  const res = await fetch(`${API_URL}/medicines/${id}`, {
    method: "DELETE", credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete medicine");
  return res.json();
};

export const importMedicinesBulk = async (medicinesData: any[]): Promise<any> => {
  const res = await fetch(`${API_URL}/medicines/bulk`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(medicinesData), credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to import medicines");
  }
  return res.json();
};
