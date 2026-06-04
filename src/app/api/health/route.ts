import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import { fetchWithTimeout } from "@/lib/fetch";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { status: "ok" | "error" | "degraded"; message?: string }> = {};
  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

  try {
    await connectMongo();
    if (mongoose.connection.readyState === 1) {
      checks.database = { status: "ok", message: "MongoDB connected" };
    } else {
      throw new Error("MongoDB not ready");
    }
  } catch (error) {
    checks.database = {
      status: "error",
      message: error instanceof Error ? error.message : "Database connection failed",
    };
    overallStatus = "unhealthy";
  }

  try {
    const geoRes = await fetchWithTimeout("http://ip-api.com/json/8.8.8.8", { timeout: 3000 });
    const geoData = await geoRes.json();
    if (geoData.status === "success") {
      checks.geoip = { status: "ok" };
    } else {
      checks.geoip = { status: "degraded", message: "GeoIP service returned unexpected data" };
      if (overallStatus === "healthy") overallStatus = "degraded";
    }
  } catch {
    checks.geoip = { status: "degraded", message: "GeoIP service unavailable" };
    if (overallStatus === "healthy") overallStatus = "degraded";
  }

  const uploadEncryptionConfigured = !!(
    process.env.FILE_ENC_KEY || process.env.CREDENTIALS_ENC_KEY
  );
  checks.uploads = {
    status: uploadEncryptionConfigured ? "ok" : "degraded",
    message: uploadEncryptionConfigured
      ? "Encrypted Mongo upload storage configured"
      : "Encrypted upload storage key is not configured",
  };
  if (!uploadEncryptionConfigured && overallStatus === "healthy") {
    overallStatus = "degraded";
  }

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    }
  );
}
