import { apiHandler } from "@/lib/api/handler";
import {
  bulkTransferOperatorDutiesSchema,
  bulkUnassignOperatorDutiesSchema,
} from "@/lib/validation";
import {
  bulkTransferOperatorDuties,
  bulkUnassignOperatorDuties,
} from "@/server/services/operatorDutyService";

const MANAGE_ROLES = ["ADMIN", "BOSS", "ENGINEER"] as const;

export const POST = apiHandler(
  { auth: true, roles: [...MANAGE_ROLES], bodySchema: bulkTransferOperatorDutiesSchema },
  async ({ body }) => bulkTransferOperatorDuties(body.fromUserId, body.toUserId)
);

export const DELETE = apiHandler(
  { auth: true, roles: [...MANAGE_ROLES], bodySchema: bulkUnassignOperatorDutiesSchema },
  async ({ body }) => bulkUnassignOperatorDuties(body.userId)
);
