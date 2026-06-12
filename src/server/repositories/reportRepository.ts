import { randomUUID } from "crypto";
import { connectMongo } from "@/lib/mongo";
import {
  caseInsensitiveRegex,
  cascadeDeleteReport,
  escapeRegex,
  withMongoTransaction,
} from "@/lib/mongoHelpers";
import {
  AttachmentModel,
  CommentModel,
  CommentReactionModel,
  ReactionModel,
  ReportModel,
  ReportViewModel,
} from "@/models";
import type { CreateReportInput, UpdateReportInput } from "@/lib/validation";
import {
  formatReportCode,
  parseReportCodeSequence,
  resolveReportCodePrefix,
} from "@/lib/reportCode";
import { loadUserBriefMap, userBriefFromMap } from "@/lib/batchUsers";
import { operatorReportStatsPipeline, reportListPipeline } from "@/lib/reportAggregations";
import { withDbRetry } from "@/lib/dbRetry";
import {
  EXCLUDE_AUTOMATED_OPERATOR,
  normalizeReportStats,
  type ReportStatsCounts,
} from "@/lib/reportStats";

export type ReportFilters = {
  page: number;
  limit: number;
  status?: string;
  priority?: string;
  operator?: string;
  category?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type ReportListRow = {
  id: string;
  code: string | null;
  operatorName: string;
  operatorEmail: string;
  problemDescription: string;
  category: string;
  priority: string;
  status: string;
  createdAt: Date;
  dateStarted: Date;
  dateResolved: Date | null;
  emailStatus: string;
  emailRecipients: string | null;
  commentCount: number;
  reactionCount: number;
};

function buildReportFilter(filters: ReportFilters): Record<string, unknown> {
  const q: Record<string, unknown> = {};
  if (filters.status && filters.status !== "all") q.status = filters.status;
  if (filters.priority && filters.priority !== "all") q.priority = filters.priority;
  if (filters.category && filters.category !== "all") q.category = filters.category;
  const and: Record<string, unknown>[] = [];
  if (filters.operator) {
    const rx = caseInsensitiveRegex(filters.operator);
    and.push({ $or: [{ operatorName: rx }, { operatorEmail: rx }] });
  }
  if (filters.search) {
    const rx = caseInsensitiveRegex(filters.search);
    and.push({
      $or: [
        { problemDescription: rx },
        { operatorName: rx },
        { code: rx },
        { _id: rx },
      ],
    });
  }
  if (and.length > 0) q.$and = and;
  if (filters.dateFrom || filters.dateTo) {
    q.createdAt = {};
    if (filters.dateFrom) {
      (q.createdAt as Record<string, Date>).$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      (q.createdAt as Record<string, Date>).$lte = new Date(filters.dateTo);
    }
  }
  return q;
}

export async function listReports(filters: ReportFilters) {
  await connectMongo();
  const skip = (filters.page - 1) * filters.limit;
  const match = buildReportFilter(filters);

  const [reports, total] = await Promise.all([
    ReportModel.aggregate(
      reportListPipeline({ match, skip, limit: filters.limit })
    ),
    ReportModel.countDocuments(match),
  ]);

  return { reports: reports as ReportListRow[], total };
}

export type OperatorReportStatRow = {
  name: string;
  total: number;
  pending: number;
  resolved: number;
  emailSent: number;
};

export async function searchReportsForAdminDebug(options: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  await connectMongo();
  const page = Math.max(options.page ?? 1, 1);
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 200);
  const skip = (page - 1) * limit;

  const match: Record<string, unknown> = {
    operatorName: { $ne: EXCLUDE_AUTOMATED_OPERATOR },
  };
  const term = options.search?.trim();
  if (term) {
    const rx = caseInsensitiveRegex(term);
    match.$or = [
      { problemDescription: rx },
      { operatorName: rx },
      { code: rx },
      { _id: rx },
    ];
  }

  const [rows, total] = await Promise.all([
    ReportModel.find(match)
      .select("code createdAt operatorName problemDescription")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ReportModel.countDocuments(match),
  ]);

  return {
    reports: rows.map((r) => ({
      id: String(r._id),
      code: r.code ?? null,
      createdAt: r.createdAt,
      operatorName: r.operatorName,
      problemDescription: r.problemDescription,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getOperatorReportStats(): Promise<OperatorReportStatRow[]> {
  await connectMongo();
  return ReportModel.aggregate(
    operatorReportStatsPipeline()
  ) as Promise<OperatorReportStatRow[]>;
}

export async function createReport(data: CreateReportInput) {
  return withDbRetry(() =>
    withMongoTransaction(async (session) => {
      const prefix = resolveReportCodePrefix(data.category, data.priority);
      const existingCodes = await ReportModel.find(
        { code: { $regex: new RegExp(`^${escapeRegex(prefix)}-`) } },
        { code: 1 }
      )
        .session(session)
        .lean();

      let maxSeq = 0;
      for (const row of existingCodes) {
        const seq = parseReportCodeSequence(row.code ?? "", prefix);
        if (seq !== null && seq > maxSeq) maxSeq = seq;
      }

      let reportCode = "";
      for (let attempt = 0; attempt < 8; attempt++) {
        const candidate = formatReportCode(prefix, maxSeq + 1 + attempt);
        const existing = await ReportModel.findOne({ code: candidate }).session(session).lean();
        if (!existing) {
          reportCode = candidate;
          break;
        }
      }
      if (!reportCode) throw new Error("No se pudo generar un código de reporte único");

      const reportId = randomUUID();
      const startedAt = new Date(data.dateStarted);
      const resolvedAt =
        data.status === "resolved"
          ? new Date(data.dateResolved ?? data.dateStarted)
          : data.dateResolved
            ? new Date(data.dateResolved)
            : null;

      const [newReport] = await ReportModel.create(
        [
          {
            _id: reportId,
            code: reportCode,
            operatorId: data.operatorId,
            operatorName: data.operatorName,
            operatorEmail: data.operatorEmail || "",
            problemDescription: data.problemDescription,
            category: data.category,
            priority: data.priority,
            status: data.status,
            emailStatus: data.emailStatus || "none",
            emailRecipients: data.emailRecipients || null,
            dateStarted: startedAt,
            dateResolved: resolvedAt,
          },
        ],
        { session }
      );

      const attachments = data.attachments?.length
        ? await AttachmentModel.insertMany(
            data.attachments.map((attachment) => ({
              _id: randomUUID(),
              url: attachment.url,
              type: attachment.type,
              data: attachment.data || null,
              reportId: String(newReport._id),
            })),
            { session }
          )
        : [];

      const plain = newReport.toObject();
      return {
        ...plain,
        id: String(newReport._id),
        attachments: attachments.map((a) => {
          const o = a.toObject();
          return { ...o, id: String(a._id) };
        }),
      };
    })
  );
}

export async function findReportId(id: string) {
  await connectMongo();
  const report = await ReportModel.findById(id).select("_id").lean();
  return report ? { id: String(report._id) } : null;
}

export async function getReportDetailById(id: string) {
  await connectMongo();
  const report = await ReportModel.findById(id).lean();
  if (!report) return null;

  const [comments, reactions, views, attachments] = await Promise.all([
    CommentModel.find({ reportId: id }).sort({ createdAt: 1 }).lean(),
    ReactionModel.find({ reportId: id }).lean(),
    ReportViewModel.find({ reportId: id }).lean(),
    AttachmentModel.find({ reportId: id }).select("url type createdAt reportId").lean(),
  ]);

  const commentIds = comments.map((c) => String(c._id));
  const commentReactions =
    commentIds.length > 0
      ? await CommentReactionModel.find({ commentId: { $in: commentIds } }).lean()
      : [];

  const authorIds = new Set<string>();
  for (const c of comments) authorIds.add(c.authorId);
  for (const r of reactions) authorIds.add(r.authorId);
  for (const cr of commentReactions) authorIds.add(cr.authorId);
  for (const v of views) authorIds.add(v.userId);

  const userMap = await loadUserBriefMap([...authorIds]);

  const commentsWithReactions = comments.map((c) => {
    const cid = String(c._id);
    const creactions = commentReactions.filter((cr) => cr.commentId === cid);
    return {
      ...c,
      id: cid,
      author: userBriefFromMap(userMap, c.authorId),
      reactions: creactions.map((cr) => ({
        ...cr,
        id: String(cr._id),
        author: userBriefFromMap(userMap, cr.authorId),
      })),
    };
  });

  return {
    ...report,
    id: String(report._id),
    comments: commentsWithReactions,
    reactions: reactions.map((r) => ({
      ...r,
      id: String(r._id),
      author: userBriefFromMap(userMap, r.authorId),
    })),
    views: views.map((v) => {
      const u = userBriefFromMap(userMap, v.userId);
      return {
        ...v,
        id: String(v._id),
        user: { id: u.id, name: u.name },
      };
    }),
    attachments: attachments.map((a) => ({ ...a, id: String(a._id) })),
  };
}

export async function deleteReport(id: string) {
  await cascadeDeleteReport(id);
}

export async function updateReport(data: UpdateReportInput) {
  await connectMongo();
  const updateData: Record<string, Date | string | null> = {};

  if (data.status) {
    updateData.status = data.status;
    if (data.status === "resolved" && !data.dateResolved) {
      updateData.dateResolved = new Date();
    }
  }

  if (data.dateResolved !== undefined) {
    updateData.dateResolved = data.dateResolved ? new Date(data.dateResolved) : null;
  }

  if (Object.keys(updateData).length === 0) return null;

  updateData.updatedAt = new Date();
  const updated = await ReportModel.findByIdAndUpdate(data.id, updateData, { new: true }).lean();
  if (!updated) return null;
  return { ...updated, id: String(updated._id) };
}

export async function getReportStats(): Promise<ReportStatsCounts> {
  await connectMongo();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [row] = await ReportModel.aggregate([
    { $match: { operatorName: { $ne: EXCLUDE_AUTOMATED_OPERATOR } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] },
        },
        resolved: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
        },
        today: {
          $sum: { $cond: [{ $gte: ["$createdAt", startOfToday] }, 1, 0] },
        },
      },
    },
  ]);

  return normalizeReportStats(row ?? undefined);
}
