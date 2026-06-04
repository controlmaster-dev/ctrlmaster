import { NextResponse } from "next/server";
import { subDays } from "date-fns";
import { apiHandler } from "@/lib/api/handler";
import { connectMongo } from "@/lib/mongo";
import { StreamMetricModel } from "@/models";

interface StreamStatsRow {
  channel: string;
  errors: number;
  blackScreen: number;
  silence: number;
}

export const GET = apiHandler({ auth: true }, async () => {
  const since = subDays(new Date(), 1);

  await connectMongo();
  const rows = await StreamMetricModel.aggregate<StreamStatsRow>([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$channel",
        errors: {
          $sum: { $cond: [{ $eq: ["$type", "ERROR"] }, 1, 0] },
        },
        blackScreen: {
          $sum: { $cond: [{ $eq: ["$type", "BLACK_SCREEN"] }, 1, 0] },
        },
        silence: {
          $sum: { $cond: [{ $eq: ["$type", "SILENCE"] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        channel: "$_id",
        errors: 1,
        blackScreen: 1,
        silence: 1,
        _id: 0,
      },
    },
  ]);

  const result = rows.map((r) => ({
    name: r.channel,
    errors: r.errors,
    blackScreen: r.blackScreen,
    silence: r.silence,
  }));

  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=30" },
  });
});
