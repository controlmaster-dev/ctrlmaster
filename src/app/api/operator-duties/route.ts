import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import {
  createOperatorDutySchema,
  deleteOperatorDutySchema,
} from "@/lib/validation";
import {
  createOperatorDuty,
  deleteOperatorDuty,
  getDiariosBoard,
} from "@/server/services/operatorDutyService";

const MANAGE_ROLES = ["ADMIN", "BOSS", "ENGINEER"] as const;

export const GET = apiHandler({ auth: true }, async () => getDiariosBoard());

export const POST = apiHandler(
  { auth: true, roles: [...MANAGE_ROLES], bodySchema: createOperatorDutySchema },
  async ({ body }) => createOperatorDuty(body)
);

export const DELETE = apiHandler(
  { auth: true, roles: [...MANAGE_ROLES], querySchema: deleteOperatorDutySchema },
  async ({ query }) => deleteOperatorDuty(query.id)
);
