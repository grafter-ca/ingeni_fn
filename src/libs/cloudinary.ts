// src/libs/cloudinary.ts
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function validateProofFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
    return "Please choose a valid image file (PNG, JPG, WEBP, or AVIF).";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Screenshot must be 5 MB or smaller.";
  }
  return null;
}

export async function uploadProofDirectlyFromDevice(
  file: File,
  folder = "ingeri-store/payment-proofs",
): Promise<string> {
  const validationError = validateProofFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary upload is not configured (missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET).",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.secure_url) {
    throw new Error(
      data?.error?.message || "Direct Cloudinary upload failed from device.",
    );
  }

  return String(data.secure_url);
}