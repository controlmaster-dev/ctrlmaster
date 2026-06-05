import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { searchReportsForAdminDebug } from "@/server/repositories/reportRepository";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ADMIN", "BOSS", "ENGINEER"];

const querySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

export const GET = apiHandler(
  { auth: true, roles: ADMIN_ROLES, querySchema },
  async ({ query }) => searchReportsForAdminDebug(query)
);
