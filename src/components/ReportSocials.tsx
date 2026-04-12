"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, Send, CheckCircle, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EMOJIS = [
  { label: "👍", icon: ThumbsUp },
  { label: "👀", icon: Eye },
  { label: "✅", icon: CheckCircle },
];

interface ReportSocialsProps {
  reportId: string;
  currentUser: any;
  initialComments: any[];
  initialReactions: any[];
  availableUsers: any[];
  onUpdate: () => void;
}

export function ReportSocials({
  reportId,
  currentUser,
  initialComments,
  initialReactions,
  availableUsers,
  onUpdate,
}: ReportSocialsProps) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);

  const filteredUsers = mentionQuery
    ? availableUsers.filter((u) =>
        u.name.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : [];

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setComment(val);

    const lastAt = val.lastIndexOf("@");
    if (lastAt !== -1 && lastAt >= val.length - 20) {
      const query = val.slice(lastAt + 1);

      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (userName: string) => {
    if (!mentionQuery) return;
    const lastAt = comment.lastIndexOf("@");
    const newText =
      comment.substring(0, lastAt) +
      `@${userName} ` +
      comment.substring(lastAt + mentionQuery.length + 1);
    setComment(newText);
    setShowMentions(false);
  };

  const reactionCounts = EMOJIS.map((e) => {
    const count = initialReactions.filter((r) => r.emoji === e.label).length;
    const hasReacted = initialReactions.some(
      (r) => r.emoji === e.label && r.authorId === currentUser?.id
    );
    const reactors = initialReactions
      .filter((r) => r.emoji === e.label)
      .map((r) => r.author.name)
      .join(", ");
    return { ...e, count, hasReacted, reactors };
  });

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !currentUser) return;

    setSubmitting(true);

    const mentionedIds: string[] = [];
    availableUsers.forEach((u) => {
      if (comment.includes(`@${u.name}`)) {
        mentionedIds.push(u.id);
      }
    });

    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          authorId: currentUser.id,
          content: comment,
          parentId: replyingTo,
          mentionedUserIds: mentionedIds,
        }),
      });
      setComment("");
      setReplyingTo(null);
      onUpdate();
    } catch (err) {
      console.error("Error sending comment", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!currentUser) return;
    try {
      await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, authorId: currentUser.id, emoji }),
      });
      onUpdate();
    } catch (err) {
      console.error("Error reacting", err);
    }
  };

  const handleCommentReaction = async (commentId: string, emoji: string) => {
    if (!currentUser) return;
    try {
      await fetch("/api/comments/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, authorId: currentUser.id, emoji }),
      });
      onUpdate();
    } catch (err) {
      console.error("Error reacting to comment", err);
    }
  };

  const renderComment = (c: any) => {
    const isReply = !!c.parentId;
    return (
      <div key={c.id} className={`flex gap-3 items-start ${isReply ? "ml-8 mt-2" : "mt-4"}`}>
        <Avatar className="w-8 h-8 rounded-full border border-border">
          <AvatarImage src={c.author.image} />
          <AvatarFallback className="text-xs bg-slate-800">
            {c.author.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl rounded-tl-sm text-sm border border-slate-100 dark:border-white/5 relative group">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                {c.author.name}
              </span>
              <span className="text-[10px] text-slate-400">
                {formatDistanceToNow(new Date(c.createdAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 break-words">
              {c.content}
            </p>

            <div className="absolute -bottom-5 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-slate-500 hover:text-[#FF0C60]"
                onClick={() => {
                  setReplyingTo(c.id);
                  setComment(`@${c.author.name} `);
                }}
              >
                Responder
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-slate-500 hover:text-blue-500"
                onClick={() => handleCommentReaction(c.id, "👍")}
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
            </div>

            {c.reactions && c.reactions.length > 0 && (
              <div className="absolute -bottom-3 left-2 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-sm">
                <ThumbsUp className="w-2 h-2 text-blue-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  {c.reactions.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-4 border-t border-slate-100 dark:border-white/5 pt-4">
      <TooltipProvider>
        <div className="flex gap-2">
          {reactionCounts.map((r) => (
            <Tooltip key={r.label}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(r.label)}
                  className={`h-8 gap-2 rounded-full border transition-all ${
                    r.hasReacted
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                      : "bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <span className="text-sm">{r.label}</span>
                  {r.count > 0 && <span className="text-xs font-bold">{r.count}</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="z-[50005] bg-black text-white text-xs border-white/10 max-w-[200px] break-words text-center">
                {r.count > 0 ? r.reactors : "Reaccionar"}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-2">
        {initialComments.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">
            Sin comentarios aún.
          </p>
        ) : (
          initialComments.map(renderComment)
        )}
      </div>

      <div className="relative">
        {replyingTo && (
          <div className="text-xs text-slate-400 mb-2 flex justify-between">
            <span>Respondiendo...</span>
            <button
              onClick={() => {
                setReplyingTo(null);
                setComment("");
              }}
            >
              Cancelar
            </button>
          </div>
        )}

        {showMentions && filteredUsers.length > 0 && (
          <div className="absolute bottom-12 left-0 bg-[#18181b] border border-white/10 rounded-md shadow-lg z-50 w-64 overflow-hidden">
            <div className="p-1 max-h-40 overflow-y-auto">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => insertMention(u.name)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 rounded flex items-center gap-2"
                >
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={u.image} />
                    <AvatarFallback>{u.name.substring(0, 1)}</AvatarFallback>
                  </Avatar>
                  {u.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSendComment} className="flex gap-2 items-center">
          <Input
            value={comment}
            onChange={handleInput}
            placeholder="Escribe un comentario..."
            className="bg-transparent border-slate-200 dark:border-white/10"
          />
          <Button
            type="submit"
            size="icon"
            disabled={submitting || !comment.trim()}
            className="shrink-0 bg-[#FF0C60] hover:bg-[#d90a50] text-white"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}