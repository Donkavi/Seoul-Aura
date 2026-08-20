import crypto from "crypto";

/** All customer review photos land in one folder so they're easy to moderate/purge. */
export const REVIEW_UPLOAD_FOLDER = "seoul-aura/reviews";

export function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

/**
 * Cloudinary signs uploads with sha1 of the alphabetically sorted `key=value`
 * params (excluding file/api_key/resource_type) followed by the API secret.
 */
export function signUploadParams(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");
}
