"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, Send, Loader2, X, Reply } from "lucide-react";
import {
  COMMENT_LIKE_REACTION_ID,
  getReportReactionLabel,
  normalizeReactionId,
} from "@/lib/reportReactions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { buildCommentTree, splitMentionParts, type CommentNode } from "@/lib/reportSocialUtils";
import { useReportSocials } from "@/hooks/useReportSocials";

interface ReportSocialsProps {
  reportId: string;
  currentUser: SocialUser | null;
  initialComments: CommentItem[];
  initialReactions: ReactionItem[];
  availableUsers: SocialUser[];
  onUpdate?: () => void;
  onSocialChange?: (comments: CommentItem[], reactions: ReactionItem[]) => void;
  embedded?: boolean;
}

export interface SocialUser {
  id: string;
  name?: string | null;
  image?: string | null;
}

export interface ReactionItem {
  emoji: string;
  authorId: string;
  author: SocialUser;
}

export interface CommentReactionItem {
  id?: string;
  emoji: string;
  authorId: string;
  author?: SocialUser;
}

export interface CommentItem {
  id: string;
  parentId?: string | null;
  author: SocialUser;
  createdAt: string | Date;
  content: string;
  reactions?: CommentReactionItem[];
  pending?: boolean;
}

function CommentContent({ content }: { content: string }) {
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
      {splitMentionParts(content).map((part, i) =>
        part.mention ? (
          <span key={i} className="font-semibold text-primary">
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </p>
  );
}

function CommentBubble({
  node,
  depth,
  currentUserId,
  onReply,
  onReact,
  pendingReaction,
  compact,
}: {
  node: CommentNode;
  depth: number;
  currentUserId?: string;
  onReply: (id: string, name: string) => void;
  onReact: (commentId: string, emoji: string) => void;
  pendingReaction: string | null;
  compact?: boolean;
}) {
  const authorName = node.author.name || "Usuario";
  const reactionKey = `${node.id}:${COMMENT_LIKE_REACTION_ID}`;
  const myReaction = node.reactions?.some(
    (r) =>
      normalizeReactionId(r.emoji) === COMMENT_LIKE_REACTION_ID &&
      r.authorId === currentUserId
  );

  return (
    <article
      className={cn(
        "group flex",
        compact ? "gap-2" : "gap-3",
        depth > 0 && (compact ? "ml-4 border-l-2 border-primary/20 pl-3" : "ml-6 border-l-2 border-primary/20 pl-4"),
        node.pending && "opacity-60"
      )}
    >
      <Avatar
        className={cn(
          "shrink-0 border border-border",
          compact ? "h-8 w-8" : "h-9 w-9"
        )}
      >
        <AvatarImage src={node.author.image || undefined} />
        <AvatarFallback className="bg-primary/15 text-xs text-primary">
          {authorName.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "rounded-2xl rounded-tl-md border border-border/70 bg-card shadow-sm transition-shadow group-hover:border-border",
            compact ? "px-3 py-2" : "px-3.5 py-2.5"
          )}
        >
          <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-xs font-semibold text-foreground">{authorName}</span>
            <time className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(node.createdAt), {
                addSuffix: true,
                locale: es,
              })}
            </time>
            {node.pending && (
              <span className="text-[10px] text-muted-foreground">Enviando…</span>
            )}
          </div>
          <CommentContent content={node.content} />

          {(node.reactions?.length ?? 0) > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(
                (node.reactions ?? []).reduce<Record<string, number>>((acc, r) => {
                  const key = normalizeReactionId(r.emoji);
                  acc[key] = (acc[key] ?? 0) + 1;
                  return acc;
                }, {})
              ).map(([stored, count]) => (
                <span
                  key={stored}
                  className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {getReportReactionLabel(stored)} {count}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-1 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => onReply(node.id, authorName)}
          >
            <Reply className="h-3 w-3" />
            Responder
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pendingReaction === reactionKey}
            className={cn(
              "h-7 gap-1 px-2 text-[11px]",
              myReaction ? "text-primary" : "text-muted-foreground hover:text-primary"
            )}
            onClick={() => onReact(node.id, COMMENT_LIKE_REACTION_ID)}
          >
            {pendingReaction === reactionKey ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ThumbsUp className="h-3 w-3" />
            )}
            Me gusta
          </Button>
        </div>

        {node.replies.length > 0 && (
          <div className={cn(compact ? "mt-2 space-y-2" : "mt-3 space-y-3")}>
            {node.replies.map((reply) => (
              <CommentBubble
                key={reply.id}
                node={reply}
                depth={depth + 1}
                currentUserId={currentUserId}
                onReply={onReply}
                onReact={onReact}
                pendingReaction={pendingReaction}
                compact={compact}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function ReportSocials({
  reportId,
  currentUser,
  initialComments,
  initialReactions,
  availableUsers,
  onUpdate,
  onSocialChange,
  embedded = false,
}: ReportSocialsProps) {
  const social = useReportSocials({
    reportId,
    currentUser,
    initialComments,
    initialReactions,
    availableUsers,
    onSocialChange,
    onActivity: onUpdate,
  });

  const commentTree = buildCommentTree(social.comments);

  return (
    <div
      className={
        embedded
          ? "flex min-h-0 flex-1 flex-col gap-2"
          : "mt-4 space-y-6 border-t border-border pt-4"
      }
    >
      <TooltipProvider delayDuration={200}>
        <div className={cn("flex shrink-0 flex-wrap", embedded ? "gap-1.5" : "gap-2")}>
          {social.reactionCounts.map((r) => {
            const busy = social.pendingReaction === r.id;
            const Icon = r.Icon;
            return (
              <Tooltip key={r.id}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!!social.pendingReaction && !busy}
                    onClick={() => social.toggleReportReaction(r.id)}
                    aria-label={r.label}
                    className={cn(
                      embedded ? "h-8 gap-1 rounded-md border px-2" : "h-9 gap-1.5 rounded-md border px-2.5",
                      "transition-all active:scale-95",
                      r.hasReacted
                        ? "border-primary/40 bg-primary/15 text-primary shadow-sm"
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                    <span className="text-xs font-medium">{r.label}</span>
                    {r.count > 0 && (
                      <span className="text-xs font-bold tabular-nums">
                        {r.count}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="z-[50005] max-w-[220px] text-center text-xs">
                  {r.count > 0 ? r.reactors : r.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      <div
        ref={social.scrollRef}
        className={cn(
          embedded ? "space-y-2.5" : "space-y-4",
          "min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar",
          !embedded && "max-h-[400px]"
        )}
      >
        {commentTree.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center text-center",
              embedded ? "py-6" : "py-10"
            )}
          >
            <p className="text-sm font-medium text-muted-foreground">Sin comentarios aún</p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              Sé el primero en dejar una nota en este reporte
            </p>
          </div>
        ) : (
          commentTree.map((node) => (
            <CommentBubble
              key={node.id}
              node={node}
              depth={0}
              currentUserId={currentUser?.id}
              onReply={social.startReply}
              onReact={social.toggleCommentReaction}
              pendingReaction={social.pendingReaction}
              compact={embedded}
            />
          ))
        )}
      </div>

      <div
        className={cn(
          "relative shrink-0 border-t border-border/60",
          embedded ? "pt-2" : "pt-3"
        )}
      >
        {social.replyingTo && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-xs text-foreground">
            <span>
              Respondiendo a <strong>{social.replyingTo.authorName}</strong>
            </span>
            <button
              type="button"
              onClick={social.cancelReply}
              className="rounded p-0.5 hover:bg-primary/20"
              aria-label="Cancelar respuesta"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {social.showMentions && social.filteredUsers.length > 0 && (
          <div className="absolute bottom-full left-0 z-50 mb-2 w-full max-w-xs overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            <p className="border-b border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Mencionar
            </p>
            <ul className="max-h-40 overflow-y-auto p-1">
              {social.filteredUsers.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => social.insertMention(u.name || "Usuario")}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={u.image || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {(u.name || "U").substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    {u.name || "Usuario"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form
          onSubmit={social.sendComment}
          className="flex gap-2 items-end"
        >
          <Textarea
            value={social.comment}
            onChange={(e) => social.handleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void social.sendComment();
              }
            }}
            placeholder={
              currentUser
                ? "Escribe un comentario… (Ctrl+Enter para enviar)"
                : "Inicia sesión para comentar"
            }
            disabled={!currentUser || social.submitting}
            rows={2}
            className="min-h-[44px] max-h-32 resize-none border-border bg-background text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!currentUser || social.submitting || !social.comment.trim()}
            className="h-11 w-11 shrink-0 bg-brand hover:bg-brand-hover text-white"
          >
            {social.submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
