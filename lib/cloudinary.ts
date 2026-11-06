import crypto from "crypto";

/** All customer review photos land in one folder so they're easy to moderate/purge. */
export const REVIEW_UPLOAD_FOLDER = "seoul-aura/reviews";

/** Delivery-charge bank slips, kept apart from public review photos. */
export const RECEIPT_UPLOAD_FOLDER = "seoul-aura/receipts";

/**
 * True when the URL is an image in our own Cloudinary account under `folder`,
 * so a buyer can't attach a link to somewhere else as their "receipt".
 */
export function isOwnCloudinaryUrl(url: unknown, folder: string): url is string {
  const config = cloudinaryConfig();
  if (!config || typeof url !== "string") return false;
  return (
    url.startsWith(`https://res.cloudinary.com/${config.cloudName}/image/upload/`) &&
    url.includes(`/${folder}/`)
  );
}

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
