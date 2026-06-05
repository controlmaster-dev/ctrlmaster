import { apiHandler } from "@/lib/api/handler";
import { assignOperatorDutySchema } from "@/lib/validation";
import { assignOperatorDuty } from "@/server/services/operatorDutyService";

const MANAGE_ROLES = ["ADMIN", "BOSS", "ENGINEER"] as const;

export const POST = apiHandler(
  { auth: true, roles: [...MANAGE_ROLES], bodySchema: assignOperatorDutySchema },
  async ({ body }) =>
    assignOperatorDuty(body.dutyId, body.userId, body.fromUserId ?? undefined)
);
