import { z } from "zod";
import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { getUserFromToken } from "@/lib/auth";
import { getRegistrationCodes } from "@/server/services/registrationCodeService";
import { getUsersDirectory } from "@/server/services/userService";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ADMIN", "BOSS", "ENGINEER"];

const querySchema = z.object({
  weekStart: z.string().min(1),
});

export const GET = apiHandler(
  { auth: true, roles: ADMIN_ROLES, querySchema },
  async ({ req, query }) => {
    const token = req.cookies.get("auth-token")?.value;
    const sessionUser = token ? await getUserFromToken(token) : null;

    const [users, securityCodes] = await Promise.all([
      getUsersDirectory({
        weekStart: query.weekStart,
        isAuthenticated: !!sessionUser,
      }),
      getRegistrationCodes(),
    ]);

    return NextResponse.json(
      { users, securityCodes },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  }
);
