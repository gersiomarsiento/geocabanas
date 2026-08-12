// lib/resizeImageForUpload.ts
//
// Client-side only (uses <canvas>). Downscales a photo before it's
// uploaded to Supabase storage, so every consumer — carousel, avatar
// circles, anything added later — reads a reasonably-sized file
// instead of whatever came straight off someone's phone camera.
//
// This matters specifically because Supabase's on-the-fly image
// transform API is a paid-plan feature we don't have, so the size has
// to be controlled at write time instead of read time.

const DEFAULT_MAX_DIMENSION = 1600; // long edge, in pixels — plenty for a carousel photo
const DEFAULT_JPEG_QUALITY = 0.82;

export async function resizeImageForUpload(
  file: File,
  options: { maxDimension?: number; quality?: number } = {},
): Promise<File> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_JPEG_QUALITY;

  // Skip resizing for anything that isn't a raster image we can safely
  // decode in <canvas> (e.g. leave SVGs alone entirely).
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // decoding failed — fall back to the original rather than blocking the upload

  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height),
  );
  const targetWidth = Math.round(bitmap.width * scale);
  const targetHeight = Math.round(bitmap.height * scale);

  // Already small enough — don't re-encode (avoids a pointless quality loss
  // on images that were already appropriately sized).
  if (scale === 1) return file;

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) return file;

  const resizedName = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], resizedName, { type: "image/jpeg" });
}
