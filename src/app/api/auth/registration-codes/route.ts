import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import {
  getRegistrationCodes,
  createRegistrationCode,
  removeRegistrationCode,
} from "@/server/services/registrationCodeService";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ADMIN", "BOSS", "ENGINEER"];

const deleteCodeQuerySchema = z.object({
  id: z.string().min(1, "Code ID required"),
});

export const GET = apiHandler(
  { auth: true, roles: ADMIN_ROLES },
  async () => getRegistrationCodes()
);

export const POST = apiHandler({ auth: true, roles: ADMIN_ROLES }, async ({ user }) => {
  const createdById = String(user?.id ?? "");
  return createRegistrationCode(createdById);
});

export const DELETE = apiHandler(
  { auth: true, roles: ADMIN_ROLES, querySchema: deleteCodeQuerySchema },
  async ({ query }) => removeRegistrationCode(query.id)
);
