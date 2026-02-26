"use client";

import { usePathname } from "next/navigation";import { jsx as _jsx } from "react/jsx-runtime";

export default function Template({ children }) {
  const pathname = usePathname();

  return (
    _jsx("div", { className: "animate-in fade-in duration-500", children:
      children }, pathname
    ));

}