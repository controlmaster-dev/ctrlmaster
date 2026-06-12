import { randomUUID } from "crypto";
import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { connectMongo } from "@/lib/mongo";
import { StreamMetricModel } from "@/models";

const metricSchema = z.object({
  channel: z.string().min(1),
  type: z.string().min(1),
  value: z.union([z.string(), z.number()]).nullable().optional(),
});

export const POST = apiHandler(
  { auth: true, bodySchema: metricSchema },
  async ({ body }) => {
    await connectMongo();
    const metric = await StreamMetricModel.create({
      _id: randomUUID(),
      channel: body.channel,
      type: body.type,
      value: body.value ?? null,
    });
    const plain = metric.toObject();
    return { ...plain, id: String(metric._id) };
  }
);
