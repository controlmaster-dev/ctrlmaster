import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = apiHandler({ auth: true }, async () => {
  const comments = await sql`
    SELECT c."id", c."content", c."authorId", c."reportId", c."parentId", c."createdAt",
           json_build_object('name', a."name", 'image', a."image") AS "author",
           json_build_object('id', r."id", 'problemDescription', r."problemDescription") AS "report"
    FROM "Comment" c
    JOIN "User" a ON a."id" = c."authorId"
    JOIN "Report" r ON r."id" = c."reportId"
    ORDER BY c."createdAt" DESC
    LIMIT 10
  `;

  return NextResponse.json(comments, {
    headers: { "Cache-Control": "private, max-age=15" },
  });
});
