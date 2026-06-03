import { apiHandler } from "@/lib/api/handler";
import { updateOperatorDutySchema } from "@/lib/validation";
import { updateOperatorDuty } from "@/server/services/operatorDutyService";

const MANAGE_ROLES = ["ADMIN", "BOSS", "ENGINEER"] as const;

export const PATCH = apiHandler(
  {
    auth: true,
    roles: [...MANAGE_ROLES],
    bodySchema: updateOperatorDutySchema,
  },
  async ({ body, route }) => {
    const id = String(route.params?.id ?? "");
    return updateOperatorDuty(id, body);
  }
);
