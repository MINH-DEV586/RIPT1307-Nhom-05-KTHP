import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import { API_URL } from "./api";

// Dynamically derive uploadthing URL from the API_URL to support custom IPs/domains
const uploadUrl = `${API_URL}/uploadthing`;

export const UploadButton = generateUploadButton({
  url: uploadUrl,
});
export const UploadDropzone = generateUploadDropzone({
  url: uploadUrl,
});
