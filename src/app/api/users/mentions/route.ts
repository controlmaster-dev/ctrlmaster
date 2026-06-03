import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = apiHandler({ auth: true }, async () => {
  const users = await sql`
    SELECT "id", "name", "image" FROM "User" ORDER BY "name" ASC
  `;

  return NextResponse.json(users, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
});
