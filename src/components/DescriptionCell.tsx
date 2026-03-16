"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function DescriptionCell({ text, maxLength = 60, className }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > maxLength;

  return (
    _jsx("div", {
      className: `relative group cursor-pointer transition-all duration-200 ${isExpanded ? 'bg-white/5 -m-2 p-2 rounded-lg z-10 shadow-xl border border-white/10' : ''} ${className}`,
      onClick: () => shouldTruncate && setIsExpanded(!isExpanded), children:

      _jsxs("div", { className: "flex items-start justify-between gap-2", children: [
        _jsx("p", { className: `text-sm text-slate-300 leading-relaxed ${!isExpanded && 'truncate'}`, style: { maxWidth: isExpanded ? 'none' : '250px' }, children:
          isExpanded ? text : text }
        ),
        shouldTruncate &&
        _jsx("span", { className: "text-slate-500 opacity-50 group-hover:opacity-100 transition-opacity mt-1", children:
          isExpanded ? _jsx(ChevronUp, { className: "w-3 h-3" }) : _jsx(ChevronDown, { className: "w-3 h-3" }) }
        )] }

      ) }
    ));

}