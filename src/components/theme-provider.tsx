"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";import { jsx as _jsx } from "react/jsx-runtime";

export function ThemeProvider({
  children,
  ...props
}) {
  return _jsx(NextThemesProvider, { ...props, children: children });
}