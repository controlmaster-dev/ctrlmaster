"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity } from "lucide-react";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ActiveUsersWidget({ users }) {

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const activeUsers = users.filter((u) => {
    if (!u.lastActive) return false;
    return new Date(u.lastActive) > fiveMinutesAgo;
  });

  return (
    _jsxs(Card, { className: "bg-card/40 backdrop-blur-md border-border shadow-none rounded-md h-full ring-1 ring-border overflow-hidden", children: [
      _jsx(CardHeader, { className: "py-4 border-b border-border bg-muted/20", children:
        _jsx("div", { className: "flex items-center justify-between", children:
          _jsxs(CardTitle, { className: "text-xs font-semibold text-muted-foreground flex items-center gap-2 tracking-tight", children: [
            _jsx(Activity, { className: "w-4 h-4 text-blue-500" }), "Actividad reciente (",
            activeUsers.length, ")"] }
          ) }
        ) }
      ),
      _jsx(CardContent, { className: "p-0", children:
        _jsx(ScrollArea, { className: "h-[252px]", children:
          _jsx("div", { className: "divide-y divide-border", children:
            activeUsers.length === 0 ?
            _jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2", children: [
              _jsx(Activity, { className: "w-8 h-8 opacity-20" }),
              _jsx("p", { className: "text-xs font-medium tracking-tight", children: "Sin actividad" })] }
            ) :

            activeUsers.map((user) =>
            _jsxs("div", { className: "group flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors", children: [
              _jsxs("div", { className: "relative", children: [
                _jsxs(Avatar, { className: "h-8 w-8 border border-border shadow-sm rounded-md", children: [
                  _jsx(AvatarImage, { src: user.image, className: "rounded-md" }),
                  _jsx(AvatarFallback, { className: "bg-muted text-muted-foreground font-semibold text-[10px] rounded-md", children:
                    user.name.substring(0, 2).toUpperCase() }
                  )] }
                ),
                _jsx("span", { className: "absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-background rounded-full shadow-sm" })] }
              ),
              _jsxs("div", { className: "flex-1 min-w-0", children: [
                _jsx("div", { className: "flex justify-between items-start", children:
                  _jsx("p", { className: "text-sm font-semibold text-foreground truncate", children: user.name }) }
                ),
                _jsx("div", { className: "flex items-center gap-2 mt-0.5", children:
                  _jsx("span", { className: "text-[10px] font-medium text-muted-foreground truncate tracking-tight", children:
                    user.currentPath === '/' ? 'Inicio' : user.currentPath?.replace('/', '') || 'Navegando' }
                  ) }
                )] }
              )] }, user.id
            )
            ) }

          ) }
        ) }
      )] }
    ));

}