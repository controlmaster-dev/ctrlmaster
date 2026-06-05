"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  CommentItem,
  CommentReactionItem,
  ReactionItem,
  SocialUser,
} from "@/components/ReportSocials";
import {
  normalizeReactionId,
  REPORT_REACTIONS,
} from "@/lib/reportReactions";

type UseReportSocialsOptions = {
  reportId: string;
  currentUser: SocialUser | null;
  initialComments: CommentItem[];
  initialReactions: ReactionItem[];
  availableUsers: SocialUser[];
  onSocialChange?: (comments: CommentItem[], reactions: ReactionItem[]) => void;
  onActivity?: () => void;
};

function normalizeComment(raw: unknown): CommentItem | null {
  if (!raw || typeof raw !== "object" || !("id" in raw)) return null;
  const row = raw as Record<string, unknown>;
  const author = row.author as SocialUser | undefined;
  if (!author?.id) return null;
  return {
    id: String(row.id),
    parentId: row.parentId ? String(row.parentId) : null,
    content: String(row.content ?? ""),
    createdAt: (row.createdAt as string) || new Date().toISOString(),
    author,
    reactions: Array.isArray(row.reactions)
      ? (row.reactions as CommentReactionItem[])
      : [],
    pending: false,
  };
}

export function useReportSocials({
  reportId,
  currentUser,
  initialComments,
  initialReactions,
  availableUsers,
  onSocialChange,
  onActivity,
}: UseReportSocialsOptions) {
  const [comments, setComments] = useState(initialComments);
  const [reactions, setReactions] = useState(initialReactions);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    authorName: string;
  } | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [pendingReaction, setPendingReaction] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setComments(initialComments);
    setReactions(initialReactions);
  }, [reportId, initialComments, initialReactions]);

  const emitChange = useCallback(
    (nextComments: CommentItem[], nextReactions: ReactionItem[]) => {
      onSocialChange?.(nextComments, nextReactions);
    },
    [onSocialChange]
  );

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const handleInput = useCallback((val: string) => {
    setComment(val);
    const lastAt = val.lastIndexOf("@");
    if (lastAt !== -1 && lastAt >= val.length - 24) {
      const query = val.slice(lastAt + 1);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  }, []);

  const insertMention = useCallback(
    (userName: string) => {
      if (mentionQuery === null) return;
      setComment((prev) => {
        const lastAt = prev.lastIndexOf("@");
        return (
          prev.substring(0, lastAt) +
          `@${userName} ` +
          prev.substring(lastAt + mentionQuery.length + 1)
        );
      });
      setShowMentions(false);
    },
    [mentionQuery]
  );

  const filteredUsers =
    mentionQuery !== null
      ? availableUsers.filter((u) =>
          (u.name || "").toLowerCase().includes(mentionQuery.toLowerCase())
        )
      : [];

  const sendComment = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = comment.trim();
      if (!text || !currentUser || submitting) return;

      const mentionedIds: string[] = [];
      availableUsers.forEach((u) => {
        if (u.name && text.includes(`@${u.name}`)) {
          mentionedIds.push(u.id);
        }
      });

      const tempId = `pending-${Date.now()}`;
      const optimistic: CommentItem = {
        id: tempId,
        parentId: replyingTo?.id ?? null,
        content: text,
        createdAt: new Date().toISOString(),
        author: currentUser,
        reactions: [],
        pending: true,
      };

      setComments((prev) => {
        const next = [...prev, optimistic];
        emitChange(next, reactions);
        return next;
      });
      setComment("");
      setReplyingTo(null);
      setShowMentions(false);
      scrollToBottom();

      setSubmitting(true);
      try {
        const body: Record<string, unknown> = {
          reportId,
          content: text,
        };
        if (optimistic.parentId) body.parentId = optimistic.parentId;
        if (mentionedIds.length > 0) body.mentionedUserIds = mentionedIds;

        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Error al publicar");

        const saved = normalizeComment(data);
        setComments((prev) => {
          const next = saved
            ? prev.map((c) => (c.id === tempId ? saved : c))
            : prev.filter((c) => c.id !== tempId);
          emitChange(next, reactions);
          return next;
        });
        onActivity?.();
      } catch (err) {
        setComments((prev) => {
          const next = prev.filter((c) => c.id !== tempId);
          emitChange(next, reactions);
          return next;
        });
        toast.error(err instanceof Error ? err.message : "No se pudo enviar el comentario");
      } finally {
        setSubmitting(false);
      }
    },
    [
      comment,
      currentUser,
      submitting,
      availableUsers,
      replyingTo,
      reportId,
      reactions,
      emitChange,
      scrollToBottom,
      onActivity,
    ]
  );

  const toggleReportReaction = useCallback(
    async (reactionId: string) => {
      if (!currentUser || pendingReaction) return;

      const prev = reactions;
      const exists = prev.some(
        (r) =>
          normalizeReactionId(r.emoji) === reactionId &&
          r.authorId === currentUser.id
      );
      const optimistic = exists
        ? prev.filter(
            (r) =>
              !(
                normalizeReactionId(r.emoji) === reactionId &&
                r.authorId === currentUser.id
              )
          )
        : [
            ...prev,
            {
              emoji: reactionId,
              authorId: currentUser.id,
              author: currentUser,
            },
          ];

      setReactions(optimistic);
      emitChange(comments, optimistic);
      setPendingReaction(reactionId);

      try {
        const res = await fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId, emoji: reactionId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Error al reaccionar");
        }
      } catch (err) {
        setReactions(prev);
        emitChange(comments, prev);
        toast.error(err instanceof Error ? err.message : "No se pudo reaccionar");
      } finally {
        setPendingReaction(null);
      }
    },
    [currentUser, pendingReaction, reactions, comments, reportId, emitChange]
  );

  const toggleCommentReaction = useCallback(
    async (commentId: string, emoji: string) => {
      if (!currentUser) return;

      const key = `${commentId}:${emoji}`;
      setPendingReaction(key);
      const snapshot = comments;

      const next = snapshot.map((c) => {
        if (c.id !== commentId) return c;
        const list = c.reactions ?? [];
        const exists = list.some(
          (r) =>
            normalizeReactionId(r.emoji) === normalizeReactionId(emoji) &&
            r.authorId === currentUser.id
        );
        const reactionsNext = exists
          ? list.filter(
              (r) =>
                !(
                  normalizeReactionId(r.emoji) === normalizeReactionId(emoji) &&
                  r.authorId === currentUser.id
                )
            )
          : [
              ...list,
              {
                emoji,
                authorId: currentUser.id,
                author: currentUser,
              },
            ];
        return { ...c, reactions: reactionsNext };
      });

      setComments(next);
      emitChange(next, reactions);

      try {
        const res = await fetch("/api/comments/react", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commentId, emoji }),
        });
        if (!res.ok) throw new Error("Error al reaccionar");
      } catch {
        setComments(snapshot);
        emitChange(snapshot, reactions);
        toast.error("No se pudo actualizar la reacción");
      } finally {
        setPendingReaction(null);
      }
    },
    [currentUser, comments, reactions, emitChange]
  );

  const startReply = useCallback((id: string, authorName: string) => {
    setReplyingTo({ id, authorName });
    setComment(`@${authorName} `);
    setShowMentions(false);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
    setComment("");
  }, []);

  const reactionCounts = REPORT_REACTIONS.map((def) => {
    const matching = reactions.filter(
      (r) => normalizeReactionId(r.emoji) === def.id
    );
    return {
      id: def.id,
      label: def.label,
      Icon: def.Icon,
      count: matching.length,
      hasReacted: matching.some((r) => r.authorId === currentUser?.id),
      reactors: matching.map((r) => r.author.name || "Usuario").join(", "),
    };
  });

  return {
    comments,
    reactions,
    comment,
    submitting,
    replyingTo,
    showMentions,
    filteredUsers,
    pendingReaction,
    scrollRef,
    reactionCounts,
    handleInput,
    insertMention,
    sendComment,
    toggleReportReaction,
    toggleCommentReaction,
    startReply,
    cancelReply,
    setComment,
  };
}
