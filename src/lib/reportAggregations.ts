import type { PipelineStage } from "mongoose";
import { CommentModel } from "@/models";
import { EXCLUDE_AUTOMATED_OPERATOR } from "@/lib/reportStats";

const LOOKUP_RID_VAR = "$$rid";

function lookupCountStage(from: string, foreignKey: string, as: string): PipelineStage {
  const localField = "$" + foreignKey;
  return {
    $lookup: {
      from,
      let: { rid: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: [localField, LOOKUP_RID_VAR] } } },
        { $count: "n" },
      ],
      as: `_${as}`,
    },
  };
}

const reportListProject = {
  id: "$_id",
  code: 1,
  operatorName: 1,
  operatorEmail: 1,
  problemDescription: 1,
  category: 1,
  priority: 1,
  status: 1,
  createdAt: 1,
  dateStarted: 1,
  dateResolved: 1,
  emailStatus: 1,
  emailRecipients: 1,
  commentCount: {
    $ifNull: [
      {
        $getField: {
          field: "n",
          input: { $arrayElemAt: ["$_commentCount", 0] },
        },
      },
      0,
    ],
  },
  reactionCount: {
    $ifNull: [
      {
        $getField: {
          field: "n",
          input: { $arrayElemAt: ["$_reactionCount", 0] },
        },
      },
      0,
    ],
  },
};

export function reportListPipeline(options: {
  match?: Record<string, unknown>;
  skip?: number;
  limit?: number;
}): PipelineStage[] {
  const stages: PipelineStage[] = [];
  if (options.match && Object.keys(options.match).length > 0) {
    stages.push({ $match: options.match });
  }
  stages.push({ $sort: { createdAt: -1 } });
  if (options.skip) stages.push({ $skip: options.skip });
  if (options.limit) stages.push({ $limit: options.limit });
  stages.push(
    lookupCountStage("comments", "reportId", "commentCount"),
    lookupCountStage("reactions", "reportId", "reactionCount"),
    { $project: reportListProject }
  );
  return stages;
}

export const recentCommentsPipeline = (limit: number): PipelineStage[] => [
  { $sort: { createdAt: -1 } },
  { $limit: limit },
  {
    $lookup: {
      from: "users",
      localField: "authorId",
      foreignField: "_id",
      pipeline: [{ $project: { name: 1, image: 1, _id: 0 } }],
      as: "authorDoc",
    },
  },
  {
    $lookup: {
      from: "reports",
      localField: "reportId",
      foreignField: "_id",
      pipeline: [{ $project: { problemDescription: 1 } }],
      as: "reportDoc",
    },
  },
  {
    $project: {
      id: "$_id",
      reportId: 1,
      authorId: 1,
      content: 1,
      parentId: 1,
      createdAt: 1,
      author: { $arrayElemAt: ["$authorDoc", 0] },
      report: {
        $let: {
          vars: { r: { $arrayElemAt: ["$reportDoc", 0] } },
          in: {
            $cond: [
              { $ifNull: ["$$r", false] },
              { id: "$reportId", problemDescription: "$$r.problemDescription" },
              null,
            ],
          },
        },
      },
    },
  },
];

export async function fetchRecentComments(limit = 10) {
  return CommentModel.aggregate(recentCommentsPipeline(limit));
}

export function operatorReportStatsPipeline(): PipelineStage[] {
  return [
    { $match: { operatorName: { $ne: EXCLUDE_AUTOMATED_OPERATOR } } },
    {
      $group: {
        _id: "$operatorName",
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        resolved: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
        },
        emailSent: {
          $sum: { $cond: [{ $eq: ["$emailStatus", "sent"] }, 1, 0] },
        },
      },
    },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0,
        name: "$_id",
        total: 1,
        pending: 1,
        resolved: 1,
        emailSent: 1,
      },
    },
  ];
}
