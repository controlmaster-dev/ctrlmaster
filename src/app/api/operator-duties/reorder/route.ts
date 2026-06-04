import { apiHandler } from "@/lib/api/handler";
import { reorderOperatorDutiesSchema } from "@/lib/validation";
import { reorderOperatorDuties } from "@/server/services/operatorDutyService";

const MANAGE_ROLES = ["ADMIN", "BOSS", "ENGINEER"] as const;

export const POST = apiHandler(
  {
    auth: true,
    roles: [...MANAGE_ROLES],
    bodySchema: reorderOperatorDutiesSchema,
  },
  async ({ body }) => reorderOperatorDuties(body.userId, body.dutyIds)
);
