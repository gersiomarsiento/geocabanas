const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Returns an error message if the file fails validation, or null if it's
 * fine to upload.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "El archivo debe ser una imagen JPEG, PNG o WEBP";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "La imagen no puede superar los 10MB";
  }
  return null;
}
