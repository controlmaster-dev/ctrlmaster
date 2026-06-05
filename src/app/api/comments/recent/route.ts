import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { connectMongo } from "@/lib/mongo";
import { fetchRecentComments } from "@/lib/reportAggregations";

export const dynamic = "force-dynamic";

export const GET = apiHandler({ auth: true }, async () => {
  await connectMongo();
  const enriched = await fetchRecentComments(10);

  return NextResponse.json(enriched, {
    headers: { "Cache-Control": "private, max-age=15" },
  });
});
