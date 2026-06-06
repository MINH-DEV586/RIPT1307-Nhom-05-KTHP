import { API_URL } from "./config";

export const deleteFile = async ({ file }: { file: string }) => {
  const res = await fetch(`${API_URL}/uploadthing/delete`, {
    method: "DELETE", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileUrl: file }), credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete file");
  }
  return res.json();
};
