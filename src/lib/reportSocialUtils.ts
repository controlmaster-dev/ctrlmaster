import type { CommentItem } from "@/components/ReportSocials";

export type CommentNode = CommentItem & { replies: CommentNode[] };

export function buildCommentTree(comments: CommentItem[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const c of comments) {
    nodes.set(c.id, { ...c, replies: [] });
  }

  for (const c of comments) {
    const node = nodes.get(c.id);
    if (!node) continue;
    if (c.parentId && nodes.has(c.parentId)) {
      nodes.get(c.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function splitMentionParts(content: string): { text: string; mention: boolean }[] {
  const parts = content.split(/(@[^\s@]+(?:\s+[^\s@]+)*)/g);
  return parts.filter(Boolean).map((text) => ({
    text,
    mention: text.startsWith("@"),
  }));
}
