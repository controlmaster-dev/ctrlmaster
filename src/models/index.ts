import mongoose, { Schema, type InferSchemaType } from "mongoose";

const jsonTransform = (_doc: unknown, ret: Record<string, unknown>) => {
  if (ret._id != null) {
    ret.id = String(ret._id);
  }
  delete ret._id;
  delete ret.__v;
  return ret;
};

const baseOpts = {
  versionKey: false,
  toJSON: { transform: jsonTransform },
  toObject: { transform: jsonTransform },
};

const stringId = { _id: { type: String } };

const userSchema = new Schema(
  {
    ...stringId,
    name: { type: String, required: true },
    email: { type: String, required: true },
    username: { type: String, default: null },
    password: { type: String, required: true },
    role: { type: String, required: true },
    image: { type: String, default: null },
    phone: { type: String, default: null },
    birthday: { type: String, default: null },
    schedule: { type: String, default: null },
    tempSchedule: { type: String, default: null },
    calendarFeedToken: { type: String, default: null },
    lastLogin: { type: Date, default: null },
    lastLoginIP: { type: String, default: null },
    lastLoginCountry: { type: String, default: null },
    currentPath: { type: String, default: null },
    lastActive: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "users" }
);
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ name: 1 });

const sessionTokenSchema = new Schema(
  {
    ...stringId,
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
  },
  { ...baseOpts, collection: "sessionTokens" }
);
sessionTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const reportSchema = new Schema(
  {
    ...stringId,
    code: { type: String, default: null },
    operatorId: { type: String, default: null },
    operatorName: { type: String, required: true },
    operatorEmail: { type: String, default: "" },
    problemDescription: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, required: true },
    status: { type: String, required: true },
    emailStatus: { type: String, default: "none" },
    emailRecipients: { type: String, default: null },
    dateStarted: { type: Date, required: true },
    dateResolved: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "reports" }
);
reportSchema.index({ code: 1 }, { unique: true, sparse: true });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ operatorId: 1 });

const commentSchema = new Schema(
  {
    ...stringId,
    reportId: { type: String, required: true, index: true },
    authorId: { type: String, required: true },
    content: { type: String, required: true },
    parentId: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "comments" }
);
commentSchema.index({ createdAt: -1 });
commentSchema.index({ reportId: 1, createdAt: 1 });

const reactionSchema = new Schema(
  {
    ...stringId,
    reportId: { type: String, required: true, index: true },
    authorId: { type: String, required: true },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "reactions" }
);
reactionSchema.index({ reportId: 1, authorId: 1, emoji: 1 }, { unique: true });

const commentReactionSchema = new Schema(
  {
    ...stringId,
    commentId: { type: String, required: true },
    authorId: { type: String, required: true },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "commentReactions" }
);
commentReactionSchema.index({ commentId: 1 });

const reportViewSchema = new Schema(
  {
    ...stringId,
    reportId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "reportViews" }
);
reportViewSchema.index({ userId: 1, reportId: 1 }, { unique: true });

const attachmentSchema = new Schema(
  {
    ...stringId,
    reportId: { type: String, required: true, index: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    data: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "attachments" }
);

const registrationCodeSchema = new Schema(
  {
    ...stringId,
    code: { type: String, required: true, unique: true },
    createdById: { type: String, default: null },
    usedById: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "registrationCodes" }
);

const credentialSchema = new Schema(
  {
    ...stringId,
    service: { type: String, required: true },
    category: { type: String, default: "" },
    username: { type: String, required: true },
    password: { type: String, required: true },
    notes: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "credentials" }
);

const specialEventSchema = new Schema(
  {
    ...stringId,
    name: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "specialEvents" }
);
specialEventSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const specialEventShiftSchema = new Schema(
  {
    ...stringId,
    eventId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    date: { type: String, required: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
  },
  { ...baseOpts, collection: "specialEventShifts" }
);
specialEventShiftSchema.index({ eventId: 1, userId: 1 });

const workScheduleSchema = new Schema(
  {
    ...stringId,
    date: { type: String, required: true },
    userId: { type: String, required: true },
    isOverride: { type: Boolean, default: false },
  },
  { ...baseOpts, collection: "workSchedules" }
);
workScheduleSchema.index({ date: 1 }, { unique: true });
workScheduleSchema.index({ date: 1, isOverride: 1 });

const weeklyScheduleSchema = new Schema(
  {
    ...stringId,
    dayOfWeek: { type: Number, required: true },
    userId: { type: String, required: true },
  },
  { ...baseOpts, collection: "weeklySchedules" }
);
weeklyScheduleSchema.index({ dayOfWeek: 1 }, { unique: true });
weeklyScheduleSchema.index({ userId: 1 });

const operatorDutySchema = new Schema(
  {
    ...stringId,
    title: { type: String, required: true },
    description: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
    priority: { type: String, default: "medium" },
    isGeneral: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "operatorDuties" }
);
operatorDutySchema.index({ sortOrder: 1, title: 1 });

const operatorDutyAssignmentSchema = new Schema(
  {
    ...stringId,
    dutyId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    sortOrder: { type: Number, default: 0 },
    assignedAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "operatorDutyAssignments" }
);
operatorDutyAssignmentSchema.index({ dutyId: 1, userId: 1 }, { unique: true });

const uploadedFileSchema = new Schema(
  {
    ...stringId,
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    ciphertext: { type: Buffer, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    createdById: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "uploadedFiles" }
);

const appSettingSchema = new Schema(
  {
    ...stringId,
    value: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "appSettings" }
);

const rateLimitSchema = new Schema(
  {
    ...stringId,
    count: { type: Number, default: 0 },
    resetAt: { type: Date, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "rateLimits" }
);

const streamMetricSchema = new Schema(
  {
    ...stringId,
    channel: { type: String, required: true },
    type: { type: String, required: true },
    value: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { ...baseOpts, collection: "streamMetrics" }
);
streamMetricSchema.index({ createdAt: -1 });
streamMetricSchema.index({ channel: 1, createdAt: -1 });

function model<T>(name: string, schema: Schema) {
  return (mongoose.models[name] as mongoose.Model<T>) || mongoose.model<T>(name, schema);
}

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: string };
export type SessionTokenDoc = InferSchemaType<typeof sessionTokenSchema> & { _id: string };
export type ReportDoc = InferSchemaType<typeof reportSchema> & { _id: string };

export const UserModel = model<UserDoc>("User", userSchema);
export const SessionTokenModel = model<SessionTokenDoc>(
  "SessionToken",
  sessionTokenSchema
);
export const ReportModel = model<ReportDoc>("Report", reportSchema);
export const CommentModel = model("Comment", commentSchema);
export const ReactionModel = model("Reaction", reactionSchema);
export const CommentReactionModel = model("CommentReaction", commentReactionSchema);
export const ReportViewModel = model("ReportView", reportViewSchema);
export const AttachmentModel = model("Attachment", attachmentSchema);
export const RegistrationCodeModel = model("RegistrationCode", registrationCodeSchema);
export const CredentialModel = model("Credential", credentialSchema);
export const SpecialEventModel = model("SpecialEvent", specialEventSchema);
export const SpecialEventShiftModel = model("SpecialEventShift", specialEventShiftSchema);
export const WorkScheduleModel = model("WorkSchedule", workScheduleSchema);
export const WeeklyScheduleModel = model("WeeklySchedule", weeklyScheduleSchema);
export const OperatorDutyModel = model("OperatorDuty", operatorDutySchema);
export const OperatorDutyAssignmentModel = model(
  "OperatorDutyAssignment",
  operatorDutyAssignmentSchema
);
export const UploadedFileModel = model("UploadedFile", uploadedFileSchema);
export const AppSettingModel = model("AppSetting", appSettingSchema);
export const RateLimitModel = model("RateLimit", rateLimitSchema);
export const StreamMetricModel = model("StreamMetric", streamMetricSchema);

export const ALL_MODELS = [
  UserModel,
  SessionTokenModel,
  ReportModel,
  CommentModel,
  ReactionModel,
  CommentReactionModel,
  ReportViewModel,
  AttachmentModel,
  RegistrationCodeModel,
  CredentialModel,
  SpecialEventModel,
  SpecialEventShiftModel,
  WorkScheduleModel,
  WeeklyScheduleModel,
  OperatorDutyModel,
  OperatorDutyAssignmentModel,
  UploadedFileModel,
  AppSettingModel,
  RateLimitModel,
  StreamMetricModel,
] as const;
