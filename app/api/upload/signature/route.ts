import { NextRequest, NextResponse } from "next/server";
import {
  REVIEW_UPLOAD_FOLDER,
  RECEIPT_UPLOAD_FOLDER,
  cloudinaryConfig,
  signUploadParams,
} from "@/lib/cloudinary";

/**
 * Hands the browser a short-lived signature so it can upload straight to
 * Cloudinary. Photos never pass through this server, which is what keeps large
 * phone photos from hitting the serverless request-body limit.
 *
 * `{ purpose: "receipt" }` signs for the payment-slip folder; anything else
 * gets the review-photo folder.
 */
export async function POST(req: NextRequest) {
  const config = cloudinaryConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Image uploads are not configured" },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const folder = body?.purpose === "receipt" ? RECEIPT_UPLOAD_FOLDER : REVIEW_UPLOAD_FOLDER;

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp };

  return NextResponse.json({
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    folder,
    timestamp,
    signature: signUploadParams(params, config.apiSecret),
  });
}
