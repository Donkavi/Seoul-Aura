import { NextResponse } from "next/server";
import {
  REVIEW_UPLOAD_FOLDER,
  cloudinaryConfig,
  signUploadParams,
} from "@/lib/cloudinary";

/**
 * Hands the browser a short-lived signature so it can upload straight to
 * Cloudinary. Photos never pass through this server, which is what keeps large
 * phone photos from hitting the serverless request-body limit.
 */
export async function POST() {
  const config = cloudinaryConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Image uploads are not configured" },
      { status: 503 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: REVIEW_UPLOAD_FOLDER, timestamp };

  return NextResponse.json({
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    folder: REVIEW_UPLOAD_FOLDER,
    timestamp,
    signature: signUploadParams(params, config.apiSecret),
  });
}
