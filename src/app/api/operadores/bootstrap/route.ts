import { z } from "zod";
import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { getUserFromToken } from "@/lib/auth";
import { getSpecialEvents } from "@/server/services/specialEventService";
import { getUsersDirectory } from "@/server/services/userService";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  weekStart: z.string().min(1),
});

export const GET = apiHandler({ auth: true, querySchema }, async ({ req, query }) => {
  const token = req.cookies.get("auth-token")?.value;
  const sessionUser = token ? await getUserFromToken(token) : null;
  const isAuthenticated = !!sessionUser;

  const [operators, allUsers, specialEvents] = await Promise.all([
    getUsersDirectory({ weekStart: query.weekStart, isAuthenticated }),
    getUsersDirectory({ isAuthenticated }),
    getSpecialEvents(),
  ]);

  return NextResponse.json(
    { operators, allUsers, specialEvents },
    { headers: { "Cache-Control": "private, max-age=30" } }
  );
});
