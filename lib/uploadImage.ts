/** Browser-side helper: uploads an image straight to Cloudinary. */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;
/** Cloudinary rejects anything larger on the free plan. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
/** Files already this small aren't worth re-encoding. */
const SKIP_SHRINK_BELOW = 400 * 1024;

/**
 * Phone photos are 3–5 MB; re-encoding to a 1600px JPEG keeps uploads quick on
 * mobile data. Falls back to the original file whenever the browser can't decode
 * it (e.g. HEIC) — Cloudinary converts those server-side instead.
 */
async function shrink(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);

    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= SKIP_SHRINK_BELOW) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/** Serves the image optimised (auto format/quality, capped width). */
function optimizedUrl(secureUrl: string): string {
  return secureUrl.replace("/image/upload/", "/image/upload/f_auto,q_auto,w_1600/");
}

/**
 * Rewrites the transformation segment to Cloudinary's slash-chained form so the
 * URL contains no commas.
 *
 * The admin product form stores images as a single comma-separated string, so a
 * URL like `.../f_auto,q_auto,w_1600/pic.jpg` would be torn into three broken
 * fragments the moment it were saved there. Chained transformations deliver the
 * same image.
 */
export function commaFreeImageUrl(url: string): string {
  return url.replace(
    /\/image\/upload\/([^/]*,[^/]*)\//,
    (_match, transform: string) => `/image/upload/${transform.split(",").join("/")}/`
  );
}

export async function uploadReviewImage(file: File): Promise<string> {
  const sigRes = await fetch("/api/upload/signature", { method: "POST" });
  if (!sigRes.ok) {
    const { error } = await sigRes.json().catch(() => ({ error: null }));
    throw new Error(error ?? "Could not start the upload. Please try again.");
  }
  const { cloudName, apiKey, folder, timestamp, signature } = await sigRes.json();

  const upload = await shrink(file);
  if (upload.size > MAX_UPLOAD_BYTES) {
    throw new Error(`"${file.name}" is too large. Please use an image under 10 MB.`);
  }

  const form = new FormData();
  form.append("file", upload, file.name);
  form.append("api_key", apiKey);
  form.append("folder", folder);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message ?? "Upload failed. Please try again.");
  }
  return optimizedUrl(data.secure_url as string);
}
