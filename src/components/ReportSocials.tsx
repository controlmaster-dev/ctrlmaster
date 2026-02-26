"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, Send, CheckCircle, Eye } from "lucide-react";
const EMOJIS = [
{ label: '👍', icon: ThumbsUp },
{ label: '👀', icon: Eye },
{ label: '✅', icon: CheckCircle }];


import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";


export function ReportSocials({ reportId, currentUser, initialComments, initialReactions, availableUsers, onUpdate }) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);


  const [mentionQuery, setMentionQuery] = useState(null);
  const [showMentions, setShowMentions] = useState(false);


  const filteredUsers = mentionQuery ?
  availableUsers.filter((u) => u.name.toLowerCase().includes(mentionQuery.toLowerCase())) :
  [];

  const handleInput = (e) => {
    const val = e.target.value;
    setComment(val);



    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1 && lastAt >= val.length - 20) {
      const query = val.slice(lastAt + 1);


      if (!query.includes(' ')) {
        setMentionQuery(query);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (userName) => {
    if (!mentionQuery) return;
    const lastAt = comment.lastIndexOf('@');
    const newText = comment.substring(0, lastAt) + `@${userName} ` + comment.substring(lastAt + mentionQuery.length + 1);
    setComment(newText);
    setShowMentions(false);
  };


  const reactionCounts = EMOJIS.map((e) => {
    const count = initialReactions.filter((r) => r.emoji === e.label).length;
    const hasReacted = initialReactions.some((r) => r.emoji === e.label && r.authorId === currentUser?.id);
    const reactors = initialReactions.filter((r) => r.emoji === e.label).map((r) => r.author.name).join(', ');
    return { ...e, count, hasReacted, reactors };
  });

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !currentUser) return;

    setSubmitting(true);




    const mentionedIds = [];
    availableUsers.forEach((u) => {
      if (comment.includes(`@${u.name}`)) {
        mentionedIds.push(u.id);
      }
    });

    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          authorId: currentUser.id,
          content: comment,
          parentId: replyingTo,
          mentionedUserIds: mentionedIds
        })
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

  const handleReaction = async (emoji) => {
    if (!currentUser) return;
    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, authorId: currentUser.id, emoji })
      });
      onUpdate();
    } catch (err) {
      console.error("Error reacting", err);
    }
  };

  const handleCommentReaction = async (commentId, emoji) => {
    if (!currentUser) return;
    try {
      await fetch('/api/comments/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, authorId: currentUser.id, emoji })
      });
      onUpdate();
    } catch (err) {
      console.error("Error reacting to comment", err);
    }
  };








  const renderComment = (c) => {
    const isReply = !!c.parentId;
    return (
      _jsxs("div", { className: `flex gap-3 items-start ${isReply ? 'ml-8 mt-2' : 'mt-4'}`, children: [
        _jsxs(Avatar, { className: "w-8 h-8 mt-1 border border-white/10 shrink-0", children: [
          _jsx(AvatarImage, { src: c.author.image || undefined }),
          _jsx(AvatarFallback, { className: "text-xs bg-slate-800", children: c.author.name.substring(0, 2).toUpperCase() })] }
        ),
        _jsx("div", { className: "flex-1 min-w-0", children:
          _jsxs("div", { className: "bg-slate-50 dark:bg-white/5 p-3 rounded-2xl rounded-tl-sm text-sm border border-slate-100 dark:border-white/5 relative group", children: [
            _jsxs("div", { className: "flex justify-between items-center mb-1", children: [
              _jsx("span", { className: "font-bold text-slate-800 dark:text-slate-200 text-xs", children: c.author.name }),
              _jsx("span", { className: "text-[10px] text-slate-400", children:
                formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: es }) }
              )] }
            ),
            _jsx("p", { className: "text-slate-600 dark:text-slate-300 break-words", children: c.content }),


            _jsxs("div", { className: "absolute -bottom-5 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [
              _jsx(Button, {
                variant: "ghost",
                size: "sm",
                className: "h-6 px-2 text-[10px] text-slate-500 hover:text-[#FF0C60]",
                onClick: () => {setReplyingTo(c.id);setComment(`@${c.author.name} `);}, children:
                "Responder" }

              ),
              _jsx(Button, {
                variant: "ghost",
                size: "sm",
                className: "h-6 px-2 text-[10px] text-slate-500 hover:text-blue-500",
                onClick: () => handleCommentReaction(c.id, '👍'), children:

                _jsx(ThumbsUp, { className: "w-3 h-3" }) }
              )] }
            ),


            c.reactions && c.reactions.length > 0 &&
            _jsxs("div", { className: "absolute -bottom-3 left-2 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-sm", children: [
              _jsx(ThumbsUp, { className: "w-2 h-2 text-blue-500" }),
              _jsx("span", { className: "text-[10px] font-bold text-slate-600 dark:text-slate-400", children: c.reactions.length })] }
            )] }

          ) }
        )] }, c.id
      ));

  };

  return (
    _jsxs("div", { className: "space-y-6 mt-4 border-t border-slate-100 dark:border-white/5 pt-4", children: [
      _jsx(TooltipProvider, { children:

        _jsx("div", { className: "flex gap-2", children:
          reactionCounts.map((r) =>
          _jsxs(Tooltip, { children: [
            _jsx(TooltipTrigger, { asChild: true, children:
              _jsxs(Button, {
                variant: "ghost",
                size: "sm",
                onClick: () => handleReaction(r.label),
                className: `h-8 gap-2 rounded-full border transition-all ${r.hasReacted ?
                'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                'bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300'}`, children: [


                _jsx(r.icon, { className: `w-4 h-4 ${r.hasReacted ? 'fill-current' : ''}` }),
                r.count > 0 && _jsx("span", { className: "text-xs font-bold", children: r.count })] }
              ) }
            ),
            _jsx(TooltipContent, { className: "z-[50005] bg-black text-white text-xs border-white/10 max-w-[200px] break-words text-center", children:
              r.count > 0 ? r.reactors : 'Reaccionar' }
            )] }, r.label
          )
          ) }
        ) }
      ),


      _jsx("div", { className: "space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-2", children:
        initialComments.length === 0 ?
        _jsx("p", { className: "text-sm text-slate-400 italic text-center py-4", children: "Sin comentarios a\xFAn." }) :




        initialComments.map(renderComment) }

      ),


      _jsxs("div", { className: "relative", children: [
        replyingTo &&
        _jsxs("div", { className: "text-xs text-slate-400 mb-2 flex justify-between", children: [
          _jsx("span", { children: "Respondiendo..." }),
          _jsx("button", { onClick: () => {setReplyingTo(null);setComment("");}, className: "hover:text-white", children: "Cancelar" })] }
        ),


        showMentions && filteredUsers.length > 0 &&
        _jsx("div", { className: "absolute bottom-12 left-0 bg-[#18181b] border border-white/10 rounded-md shadow-lg z-50 w-64 overflow-hidden", children:
          _jsx("div", { className: "p-1 max-h-40 overflow-y-auto", children:
            filteredUsers.map((u) =>
            _jsxs("button", {

              onClick: () => insertMention(u.name),
              className: "w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 rounded flex items-center gap-2", children: [

              _jsxs(Avatar, { className: "w-5 h-5", children: [
                _jsx(AvatarImage, { src: u.image }),
                _jsx(AvatarFallback, { children: u.name.substring(0, 1) })] }
              ),
              u.name] }, u.id
            )
            ) }
          ) }
        ),


        _jsxs("form", { onSubmit: handleSendComment, className: "flex gap-2 items-center", children: [
          _jsx(Input, {
            value: comment,
            onChange: handleInput,
            placeholder: "Escribe un comentario...",
            className: "bg-transparent border-slate-200 dark:border-white/10" }
          ),
          _jsx(Button, {
            type: "submit",
            size: "icon",
            disabled: submitting || !comment.trim(),
            className: "shrink-0 bg-[#FF0C60] hover:bg-[#d90a50] text-white", children:

            _jsx(Send, { className: "w-4 h-4 ml-0.5" }) }
          )] }
        )] }
      )] }
    ));

}